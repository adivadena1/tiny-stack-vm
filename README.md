# Tiny Stack VM

[![make.fun · tiny-stack-vm-01-run-20261122](https://make.fun/badge/tiny-stack-vm-01-run-20261122.svg)](https://make.fun/bounty/tiny-stack-vm-01-run-20261122?utm_source=github&utm_medium=readme&utm_campaign=tiny-stack-vm-01-run-20261122)
[![rank](https://make.fun/badge/tiny-stack-vm-01-run-20261122/adivadena1/tiny-stack-vm/rank.svg)](https://make.fun/bounty/tiny-stack-vm-01-run-20261122/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=tiny-stack-vm-01-run-20261122)
[![reward](https://make.fun/badge/tiny-stack-vm-01-run-20261122/adivadena1/tiny-stack-vm/reward.svg)](https://make.fun/bounty/tiny-stack-vm-01-run-20261122?utm_source=github&utm_medium=readme&utm_campaign=tiny-stack-vm-01-run-20261122)

An original stack VM for make.fun's tiny stack ISA: 32-bit wrapping integers, a 256-value stack, branches, calls, 256 words of memory, input/output and ten traps with their own exit codes. One run answers all 40 instances of a set. Built for the [Tiny Stack VM bounty](https://make.fun/bounty/tiny-stack-vm-01-run-20261122) — try make.fun with my referral: https://make.fun/r/3txr3dna

## Run it

`node main.ts` reads `/input/<id>/program.bin` + `input.bin` and writes `/output/<id>/stdout.bin` + `exit.txt` (`MAKEFUN_INPUT_DIR` / `MAKEFUN_OUTPUT_DIR` override the paths).
