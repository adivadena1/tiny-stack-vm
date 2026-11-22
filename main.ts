// Tiny stack VM for make.fun's tiny stack ISA v1. One run answers a whole set:
// /input/<id>/program.bin + input.bin -> /output/<id>/stdout.bin + exit.txt.
// Deterministic: no clock, no randomness, no environment-driven variation.
import { mkdirSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const MAX_STEPS = 1e6, MAX_OUT = 65536;

function run(p: Uint8Array, inp: Uint8Array) {
  const n = p.length, S = new Int32Array(256); // data stack
  let sp = 0;
  const C = new Int32Array(64); // return addresses
  let cp = 0;
  const M = new Int32Array(256); // memory words
  const o = new Uint8Array(MAX_OUT);
  let ol = 0, ip = 0, pc = 0, steps = 0;
  const done = (code: number) => ({ code, out: o.subarray(0, ol) });
  for (;;) {
    if (steps >= MAX_STEPS) return done(10);
    if (pc < 0 || pc >= n) return done(9);
    const op = p[pc];
    // Immediate length: PUSH8 1, PUSH32 4, jumps and calls 2, the rest 0.
    const imm = op === 1 ? 1 : op === 2 ? 4 : op >= 0x30 && op <= 0x33 ? 2 : 0;
    if (pc + imm >= n) return done(9);
    steps++;
    const nx = pc + 1 + imm; // address just past this instruction
    pc = nx;
    switch (op) {
      case 0x00: return done(0);
      case 0x01: // PUSH8, sign-extended
        if (sp === 256) return done(3);
        S[sp++] = (p[nx - 1] << 24) >> 24;
        break;
      case 0x02: // PUSH32, little-endian
        if (sp === 256) return done(3);
        S[sp++] = p[nx - 4] | (p[nx - 3] << 8) | (p[nx - 2] << 16) | (p[nx - 1] << 24);
        break;
      case 0x03:
        if (sp < 1) return done(2);
        sp--;
        break;
      case 0x04:
        if (sp < 1) return done(2);
        if (sp === 256) return done(3);
        S[sp] = S[sp - 1];
        sp++;
        break;
      case 0x05: {
        if (sp < 2) return done(2);
        const t = S[sp - 1];
        S[sp - 1] = S[sp - 2];
        S[sp - 2] = t;
        break;
      }
      case 0x06:
        if (sp < 2) return done(2);
        if (sp === 256) return done(3);
        S[sp] = S[sp - 2];
        sp++;
        break;
      case 0x07: { // ROT: (a b c -- b c a)
        if (sp < 3) return done(2);
        const t = S[sp - 3];
        S[sp - 3] = S[sp - 2];
        S[sp - 2] = S[sp - 1];
        S[sp - 1] = t;
        break;
      }
      case 0x10: case 0x11: case 0x12: case 0x13: case 0x14: case 0x15: case 0x16:
      case 0x18: case 0x19: case 0x1a: case 0x1c: case 0x1d: case 0x1e:
      case 0x20: case 0x21: case 0x22: {
        // Two-operand arithmetic, logic, shifts and comparisons.
        if (sp < 2) return done(2);
        const b = S[sp - 1], a = S[sp - 2];
        let r: number;
        if (op < 0x13) r = op === 0x10 ? (a + b) | 0 : op === 0x11 ? (a - b) | 0 : Math.imul(a, b);
        else if (op < 0x17) {
          if (!b) return done(4);
          r = op === 0x13 ? (a / b) | 0 : op === 0x14 ? (a % b) | 0
            : op === 0x15 ? ((a >>> 0) / (b >>> 0)) | 0 : ((a >>> 0) % (b >>> 0)) | 0;
        } else if (op < 0x1b) r = op === 0x18 ? a & b : op === 0x19 ? a | b : a ^ b;
        else if (op < 0x1f) r = op === 0x1c ? a << (b & 31) : op === 0x1d ? a >> (b & 31) : (a >>> (b & 31)) | 0;
        else r = op === 0x20 ? +(a === b) : op === 0x21 ? +(a < b) : +((a >>> 0) < (b >>> 0));
        S[sp - 2] = r;
        sp--;
        break;
      }
      case 0x17: // NEG wraps: -(-2147483648) is -2147483648
        if (sp < 1) return done(2);
        S[sp - 1] = -S[sp - 1] | 0;
        break;
      case 0x1b:
        if (sp < 1) return done(2);
        S[sp - 1] = ~S[sp - 1];
        break;
      case 0x30: { // JMP: pc = next instruction + signed offset
        const off = ((p[nx - 2] | (p[nx - 1] << 8)) << 16) >> 16;
        pc = nx + off;
        break;
      }
      case 0x31: case 0x32: { // JZ / JNZ
        if (sp < 1) return done(2);
        const off = ((p[nx - 2] | (p[nx - 1] << 8)) << 16) >> 16;
        const v = S[--sp];
        if (op === 0x31 ? v === 0 : v !== 0) pc = nx + off;
        break;
      }
      case 0x33: // CALL
        if (cp === 64) return done(7);
        C[cp++] = nx;
        pc = p[nx - 2] | (p[nx - 1] << 8);
        break;
      case 0x34:
        if (cp === 0) return done(8);
        pc = C[--cp];
        break;
      case 0x40: { // LOAD
        if (sp < 1) return done(2);
        const a = S[sp - 1];
        if (a < 0 || a > 255) return done(6);
        S[sp - 1] = M[a];
        break;
      }
      case 0x41: { // STORE
        if (sp < 2) return done(2);
        const a = S[sp - 1];
        if (a < 0 || a > 255) return done(6);
        M[a] = S[sp - 2];
        sp -= 2;
        break;
      }
      case 0x50: { // PRINT: decimal, no newline
        if (sp < 1) return done(2);
        const t = String(S[sp - 1]);
        if (ol + t.length > MAX_OUT) return done(11);
        for (let i = 0; i < t.length; i++) o[ol++] = t.charCodeAt(i);
        sp--;
        break;
      }
      case 0x51: // PUTC: one byte
        if (sp < 1) return done(2);
        if (ol === MAX_OUT) return done(11);
        o[ol++] = S[--sp] & 255;
        break;
      case 0x52: // IN: -1 once the input is used up
        if (sp === 256) return done(3);
        S[sp++] = ip < inp.length ? inp[ip++] : -1;
        break;
      case 0x53: // EXIT: low byte is the exit code
        if (sp < 1) return done(2);
        return done(S[--sp] & 255);
      default:
        return done(5);
    }
  }
}

// Answer the whole set in one run.
const I = process.env.MAKEFUN_INPUT_DIR ?? "/input";
const O = process.env.MAKEFUN_OUTPUT_DIR ?? "/output";
for (const id of readdirSync(I).sort()) {
  let inp: Buffer;
  try {
    inp = readFileSync(join(I, id, "input.bin"));
  } catch {
    inp = Buffer.alloc(0);
  }
  const r = run(readFileSync(join(I, id, "program.bin")), inp);
  mkdirSync(join(O, id), { recursive: true });
  writeFileSync(join(O, id, "stdout.bin"), r.out);
  writeFileSync(join(O, id, "exit.txt"), r.code + "\n");
}
