import type { NoulQuestion } from "@typesafe-ai/sdk";

/** The kind of source fragment a rule judges. */
export type Target = "comment" | "function" | "test" | "type" | "type-guard";

/** A yes/no question where yes means a violation. */
export interface Rule {
  criteria: NonNullable<NoulQuestion["criteria"]>;
  id: string;
  instructions: string;
  target: Target;
}
