# jev-lint

Semantic lint rules that ask [Jev](https://docs.typesafe.ai) one yes/no question about a code fragment.

| Aspect   | Policy                                                        |
| -------- | ------------------------------------------------------------- |
| Scope    | What types, oxlint, knip, jscpd, and commitlint cannot decide |
| Question | Phrased so that "yes" means a violation                       |

## Usage

```sh
just jev-lint                # Changed and untracked files against main
just jev-lint --base HEAD~3  # Changes since another ref
```

- Reads `TYPESAFE_API_KEY` from 1Password through fnox, as set in `fnox.toml`
- Sends the changed comments and nearby code to the TypeSafe API
- Prints each finding as `file:line rule probability`
- Exits 0: findings are candidates, not verdicts

## Rules

| Rule | Question |
| --- | --- |
| `comment-narrates-code` | Does the comment only restate the code, without an outside constraint? |

## Candidate rules

Add a candidate as a rule when reviews keep missing what it catches.

### Comments

| Rule | Question |
| --- | --- |
| `comment-contradicts-code` | Does the comment claim a behavior the code does not have? |
| `comment-excuses-workaround` | Does the comment justify a surprise in our own code instead of fixing it? |
| `workaround-without-constraint` | Does a workaround comment omit the constraint it works around? |
| `comment-holds-type-invariant` | Does the comment state a field rule that the type could encode? |
| `suppression-hides-correctness` | Does a lint or type suppression silence a correctness or safety rule? |

### Names

| Rule | Question |
| --- | --- |
| `query-name-with-side-effects` | Does a read-only name such as get, is, or has hide a state change? |
| `name-body-mismatch` | Would a reader of the name alone guess the body wrong? |
| `overly-abstract-name` | Does a generic name such as handle or manager hide the job? |
| `phase-named-module` | Is the unit named after a step such as load or save, not its domain? |
| `inconsistent-sibling-verbs` | Do sibling functions use get, fetch, and load for the same job? |

### Functions

| Rule | Question |
| --- | --- |
| `multiple-responsibilities` | Does the function do jobs that change for different reasons? |
| `hard-wired-nondeterminism` | Does core logic read the clock, randomness, or network directly? |
| `speculative-abstraction` | Does an abstraction or option have one use and no present need? |
| `pass-through-wrapper` | Does the function only forward its arguments to one call? |
| `swallowed-error` | Does a catch hide a failure that the caller needed to know about? |
| `inconsistent-error-strategy` | Do similar operations mix throw, Result, and null without reason? |
| `unearned-cast` | Does an `as` cast claim a type that no earlier check proved? |
| `lying-type-guard` | Can the type guard return true for a value that is not the type? |
| `partiality-smell` | Does a "never happens" branch exist only because the input is loose? |
| `redundant-internal-validation` | Does the function recheck data that is already a domain type? |

### Types

| Rule | Question |
| --- | --- |
| `optional-field-bag` | Can the optional fields or booleans form a contradictory state? |
| `unbranded-lookalike-params` | Do parameters share a primitive type but differ in meaning? |

### Modules

| Rule | Question |
| --- | --- |
| `layer-mixing` | Does the module mix presentation, data access, and domain rules? |
| `same-layer-concept-entanglement` | Does the module combine two independent domain concepts? |
| `implicit-call-order` | Must its functions run in an order that names and types hide? |
| `shared-mutable-module-state` | Does module-level mutable state pass data between functions? |

### Tests

| Rule | Question |
| --- | --- |
| `test-observes-no-behavior` | Would the test pass if every function under test returned undefined? |
| `weak-assertions` | Do the assertions check only existence or truthiness? |
| `implementation-detail-assertions` | Does the test assert internal calls instead of observable results? |
| `heavy-test-setup` | Does the unit need many mocked collaborators to run? |
| `test-constant-pin` | Does the assertion restate a constant instead of running logic? |
| `test-self-referential` | Does the code under test compute the expected value? |

### Commits

| Rule | Question |
| --- | --- |
| `refactor-changes-behavior` | Does a `refactor` commit change observable behavior? |
| `mixed-hats-commit` | Does the commit both change behavior and restructure code? |
| `non-atomic-commit` | Does the commit bundle changes that could be verified separately? |
| `commit-claims-mismatch` | Does the message claim a change the diff lacks, or omit the main one? |
| `commit-message-slop` | Does the message use filler words instead of naming the change? |
| `symptom-guard-diff` | Does the diff add a fallback that silences a failure, not its cause? |
| `ad-hoc-branch-diff` | Does the diff add a special case to a flow unrelated to the change? |
| `load-transfer-extraction` | Does an extracted single-use function add indirection, not clarity? |
