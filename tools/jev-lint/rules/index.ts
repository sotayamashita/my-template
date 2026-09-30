import type { Rule } from "../rule.ts";
import { commentExcusesWorkaround } from "./comment-excuses-workaround.ts";
import { commentHoldsTypeInvariant } from "./comment-holds-type-invariant.ts";
import { commentNarratesCode } from "./comment-narrates-code.ts";
import { lyingTypeGuard } from "./lying-type-guard.ts";
import { optionalFieldBag } from "./optional-field-bag.ts";
import { partialitySmell } from "./partiality-smell.ts";
import { passThroughWrapper } from "./pass-through-wrapper.ts";
import { redundantInternalValidation } from "./redundant-internal-validation.ts";
import { suppressionHidesCorrectness } from "./suppression-hides-correctness.ts";
import { swallowedError } from "./swallowed-error.ts";
import { testConstantPin } from "./test-constant-pin.ts";
import { testObservesNoBehavior } from "./test-observes-no-behavior.ts";
import { testSelfReferential } from "./test-self-referential.ts";
import { unbrandedLookalikeParams } from "./unbranded-lookalike-params.ts";

export const rules: readonly Rule[] = [
  commentExcusesWorkaround,
  commentHoldsTypeInvariant,
  commentNarratesCode,
  lyingTypeGuard,
  optionalFieldBag,
  partialitySmell,
  passThroughWrapper,
  redundantInternalValidation,
  suppressionHidesCorrectness,
  swallowedError,
  testConstantPin,
  testObservesNoBehavior,
  testSelfReferential,
  unbrandedLookalikeParams,
];
