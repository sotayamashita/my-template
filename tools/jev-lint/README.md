# jev-lint

jev-lint asks [Jev](https://docs.typesafe.ai) one yes/no question per rule about each changed code fragment.

| Aspect   | Policy                                                        |
| -------- | ------------------------------------------------------------- |
| Scope    | What types, oxlint, knip, jscpd, and commitlint cannot decide |
| Question | Phrased so that "yes" means a violation                       |

## Usage

```sh
node tools/jev-lint/index.ts                # Changed and untracked files against main
node tools/jev-lint/index.ts --base HEAD~3  # Changes since another ref
node tools/jev-lint/index.ts --staged       # Staged changes, for a pre-commit hook
```

- Reads `TYPESAFE_API_KEY` from the environment
- Sends changed comments, functions, types, and tests to the TypeSafe API
- Prints each finding as `file:line rule probability`
- Reports a finding when Jev answers yes with a probability of 0.9 or more
  - At that level Jev is as accurate as a reasoning model ([arXiv 2609.26550](https://arxiv.org/abs/2609.26550))
- Marks a finding from 0.5 to 0.9 `unsure` and prints its question
  - The agent reading the output answers the question itself
- Always exits 0, because a finding is a candidate for review

## Integrations

### hk

Run jev-lint on staged changes in the `pre-commit` hook:

```pkl
["jev-lint"] {
    glob = List("**/*.{js,mjs,cjs,ts,mts,cts,jsx,tsx}")
    check = "node tools/jev-lint/index.ts --staged"
    output_summary = "stdout"
}
```

- hk stashes unstaged changes first, so the files on disk match the index
- `output_summary` makes hk print the findings after the hook runs
- The commit goes through whatever jev-lint finds

## Rules

| Rule | Target | Question |
| --- | --- | --- |
| `comment-narrates-code` | comment | Does the comment only restate the code, without an outside constraint? |
| `comment-excuses-workaround` | comment | Does the comment justify a surprise in our own code instead of fixing it? |
| `comment-holds-type-invariant` | comment | Does the comment state a field rule that the type could encode? |
| `suppression-hides-correctness` | comment | Does a lint or type suppression silence a correctness or safety rule? |
| `lying-type-guard` | type guard | Can the type guard return true for a value that is not the type? |
| `swallowed-error` | function | Does a catch hide a failure that the caller needed to know about? |
| `pass-through-wrapper` | function | Does the function only forward its arguments to one call? |
| `partiality-smell` | function | Does a "never happens" branch exist only because the input is loose? |
| `redundant-internal-validation` | function | Does the function recheck data that is already a domain type? |
| `unbranded-lookalike-params` | function | Do parameters share a primitive type but differ in meaning? |
| `optional-field-bag` | type | Can the optional fields or booleans form a contradictory state? |
| `test-observes-no-behavior` | test | Would the test pass if every function under test returned undefined? |
| `test-constant-pin` | test | Does the assertion restate a constant instead of running logic? |
| `test-self-referential` | test | Does the code under test compute the expected value? |

## Candidate rules

Add a candidate as a rule when reviews keep missing what it catches.

### Comments

| Rule | Question |
| --- | --- |
| `comment-contradicts-code` | Does the comment claim a behavior the code does not have? |
| `workaround-without-constraint` | Does a workaround comment omit the constraint it works around? |

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
| `inconsistent-error-strategy` | Do similar operations mix throw, Result, and null without reason? |

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
| `weak-assertions` | Do the assertions check only existence or truthiness? |
| `implementation-detail-assertions` | Does the test assert internal calls instead of observable results? |
| `heavy-test-setup` | Does the unit need many mocked collaborators to run? |

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
