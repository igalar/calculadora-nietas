// Lógica de la calculadora, sin nada de pantalla ni sonido, para poder probarla.
// Funciona como una calculadora de bolsillo: cada operación se resuelve al presionar la siguiente.
import { numeroATokens, numeroACanonico, formatoChile } from './numeros.js';

export const MAX_DIGITOS = 12;
export const MENSAJE_ERROR = '¡Uy! Eso no se puede';
export const MENSAJE_GRANDE = '¡Uy! Es muy grande';

const SIMBOLO = { '+': '+', '-': '−', '×': '×', '÷': '÷' };
const VOZ_TECLA = {
  '+': 'mas', '-': 'menos', '×': 'por', '÷': 'dividido', ',': 'coma', '%': 'porciento',
  'x2': 'cuadrado', 'inv': 'inverso', 'raiz': 'raiz', 'borrar': 'borrar', 'ac': 'borrar_todo', '=': 'igual',
};

class ErrorCalculo extends Error {}

/**
 * Ajusta un resultado a la pantalla: quita el ruido de coma flotante (0,1 + 0,2 = 0,3)
 * y lo redondea para que quepa en 12 dígitos. Devuelve el texto canónico ("0.3").
 */
export function ajustarResultado(n) {
  if (!Number.isFinite(n)) throw new ErrorCalculo(MENSAJE_ERROR);
  const limpio = Number(n.toPrecision(MAX_DIGITOS));
  const digitosEnteros = Math.trunc(Math.abs(limpio)).toString().length;
  if (digitosEnteros > MAX_DIGITOS) throw new ErrorCalculo(MENSAJE_GRANDE);
  let s = limpio.toFixed(MAX_DIGITOS - digitosEnteros);
  if (s.includes('.')) s = s.replace(/0+$/, '').replace(/\.$/, '');
  if (s === '-0') s = '0';
  return s;
}

function contarDigitos(s) {
  return s.replace(/[^0-9]/g, '').length;
}

export class Calculadora {
  constructor() { this.limpiar(); }

  limpiar() {
    this.actual = '0';          // número en pantalla (texto canónico, con punto decimal)
    this.escribiendo = false;   // la próxima cifra se agrega a "actual"
    this.hayOperando = false;   // hay un número nuevo después de la última operación
    this.acumulado = 0;
    this.operacion = null;      // '+', '-', '×', '÷'
    this.expresion = '';        // línea pequeña, ej. "12 ×"
    this.error = null;
  }

  /** Texto grande de la pantalla, en formato chileno. */
  get pantalla() {
    return this.error || formatoChile(this.actual);
  }

  /**
   * Procesa una tecla. Devuelve la lista de audios que la voz debe decir.
   * Teclas: '0'..'9', ',', '+', '-', '×', '÷', '=', '%', 'x2', 'inv', 'raiz', 'borrar', 'ac'
   */
  presionar(tecla) {
    if (tecla === 'ac') { this.limpiar(); return ['borrar_todo']; }
    if (this.error) {
      // Después de un error, cualquier número parte de cero; lo demás se ignora
      this.limpiar();
      if (!/^[0-9,]$/.test(tecla)) return [VOZ_TECLA[tecla] || 'n' + tecla];
    }
    try {
      if (/^[0-9]$/.test(tecla)) return this.cifra(tecla);
      if (tecla === ',') return this.coma();
      if (tecla in SIMBOLO) return this.operar(tecla);
      if (tecla === '=') return this.igual();
      if (tecla === 'borrar') return this.borrar();
      return this.unaria(tecla);
    } catch (e) {
      if (!(e instanceof ErrorCalculo)) throw e;
      this.error = e.message;
      this.expresion = '';
      this.operacion = null;
      this.escribiendo = false;
      return ['no_se_puede'];
    }
  }

  cifra(d) {
    if (!this.escribiendo) {
      this.actual = d;
      this.escribiendo = true;
      if (!this.operacion) this.expresion = '';
    } else if (contarDigitos(this.actual) < MAX_DIGITOS) {
      this.actual = this.actual === '0' ? d : this.actual + d;
    } else {
      return [];
    }
    this.hayOperando = true;
    return ['n' + d];
  }

  coma() {
    if (!this.escribiendo) {
      this.actual = '0.';
      this.escribiendo = true;
      if (!this.operacion) this.expresion = '';
    } else if (!this.actual.includes('.') && contarDigitos(this.actual) < MAX_DIGITOS) {
      this.actual += '.';
    }
    this.hayOperando = true;
    return ['coma'];
  }

  valorActual() {
    return Number(this.actual.replace(/\.$/, ''));
  }

  calcular(a, op, b) {
    switch (op) {
      case '+': return a + b;
      case '-': return a - b;
      case '×': return a * b;
      case '÷':
        if (b === 0) throw new ErrorCalculo(MENSAJE_ERROR);
        return a / b;
    }
  }

  operar(op) {
    if (this.operacion && this.hayOperando) {
      this.actual = ajustarResultado(this.calcular(this.acumulado, this.operacion, this.valorActual()));
    }
    // Si se presionan dos operaciones seguidas, vale la última
    this.acumulado = this.operacion && !this.hayOperando ? this.acumulado : this.valorActual();
    this.actual = this.actual.replace(/\.$/, '');
    this.operacion = op;
    this.escribiendo = false;
    this.hayOperando = false;
    this.expresion = formatoChile(numeroACanonico(this.acumulado)) + ' ' + SIMBOLO[op];
    return [VOZ_TECLA[op]];
  }

  igual() {
    if (this.operacion) {
      const b = this.valorActual();
      const resultado = ajustarResultado(this.calcular(this.acumulado, this.operacion, b));
      this.expresion = formatoChile(numeroACanonico(this.acumulado)) + ' ' + SIMBOLO[this.operacion] + ' ' +
        formatoChile(numeroACanonico(b)) + ' =';
      this.actual = resultado;
      this.operacion = null;
    } else {
      this.actual = this.actual.replace(/\.$/, '');
    }
    this.escribiendo = false;
    this.hayOperando = false;
    return ['igual', ...numeroATokens(this.actual)];
  }

  unaria(tecla) {
    const n = this.valorActual();
    let r;
    let texto;
    const x = formatoChile(numeroACanonico(n));
    switch (tecla) {
      case 'x2': r = n * n; texto = x + '²'; break;
      case 'inv':
        if (n === 0) throw new ErrorCalculo(MENSAJE_ERROR);
        r = 1 / n; texto = '1/' + x; break;
      case 'raiz':
        if (n < 0) throw new ErrorCalculo(MENSAJE_ERROR);
        r = Math.sqrt(n); texto = '√' + x; break;
      case '%':
        // Como en las calculadoras de bolsillo: 200 + 10 % → 20 ; 50 % → 0,5
        r = this.operacion === '+' || this.operacion === '-' ? this.acumulado * n / 100 : n / 100;
        texto = x + ' %'; break;
      default:
        return [];
    }
    this.actual = ajustarResultado(r);
    this.escribiendo = false;
    this.hayOperando = true;
    const previa = this.operacion ? formatoChile(numeroACanonico(this.acumulado)) + ' ' + SIMBOLO[this.operacion] + ' ' : '';
    this.expresion = previa + texto;
    return [VOZ_TECLA[tecla], ...numeroATokens(this.actual)];
  }

  // Borra la última cifra de lo que se ve, sea un número que se escribe o un resultado
  borrar() {
    let s = this.actual.length > 1 ? this.actual.slice(0, -1) : '0';
    if (s === '-' || s === '') s = '0';
    if (s === '-0') s = '0';
    this.actual = s;
    this.escribiendo = s !== '0';
    this.hayOperando = true;
    return ['borrar'];
  }
}
