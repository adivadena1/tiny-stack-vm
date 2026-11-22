# tiny-stack-vm

A tiny stack virtual machine for make.fun's "Build a tiny stack virtual machine, 22 November 2026" bounty.

[![make.fun](https://make.fun/badge/tiny-stack-vm-01-run-20261122.svg)](https://make.fun/bounty/tiny-stack-vm-01-run-20261122)
[![rank](https://make.fun/badge/tiny-stack-vm-01-run-20261122/adivadena1/tiny-stack-vm/rank.svg)](https://make.fun/bounty/tiny-stack-vm-01-run-20261122)
[![reward](https://make.fun/badge/tiny-stack-vm-01-run-20261122/adivadena1/tiny-stack-vm/reward.svg)](https://make.fun/bounty/tiny-stack-vm-01-run-20261122)

Bounty: https://make.fun/bounty/tiny-stack-vm-01-run-20261122
Referral: https://make.fun/r/3txr3dna

## What it does

`main.ts` (Node 22) interprets make.fun's tiny stack ISA from scratch: 32-bit wrapping integers, a 256-value stack, branches, calls, 256 words of memory, input/output, and all ten traps. One run answers all 40 instances, deterministically, well inside 60 seconds.

It reads `/input/<id>/program.bin` + `input.bin` and writes `/output/<id>/stdout.bin` + `exit.txt` per instance. Run it as `node main.ts`.
