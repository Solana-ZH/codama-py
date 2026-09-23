# IDL corpus

Production IDLs used to check that generated clients are valid Python.

The unit tests cover single nodes; this corpus covers whole programs, where the
failures actually show up: a seed type nobody used before, an inline tuple, a
legacy IDL. Every bug fixed in #14, #15, #16 and #17 was found this way.

## Running it

```bash
pnpm build
pip install -r e2e/corpus/requirements.txt
python3 e2e/corpus/check.py            # the whole corpus
python3 e2e/corpus/check.py pump_amm   # one program
```

It generates each client into `e2e/corpus/out/` (gitignored) and imports every
generated module. The exit code is non-zero if any program does not behave as
`corpus.json` says it should.

## corpus.json

Each entry records where the IDL came from, its format, the program address
where the IDL does not carry one, and what to expect:

- `imports` — the client is generated and every module imports.
- `generates` — the client is generated, but importing it is known to fail.
  Only `drift_v2`, whose IDL declares two fields named `padding` in `LPPool`;
  no Python class can have that. Kept so the case stays visible.

## Notes

- The IDLs are snapshots. Programs are upgraded, so refreshing them from the
  listed sources may surface new cases.
- Importing proves the generated code is valid and its names resolve. It does
  not prove the encoding is correct; that needs on-chain data and is not part
  of this offline check.
- `orca_whirlpool` imports cleanly, but its tick array PDAs are seeded with
  `start_tick_index.to_string()` while the IDL declares an `i32` argument, so
  the generated `find_TickArray` does not match mainnet. That is an IDL
  limitation rather than a renderer bug.
