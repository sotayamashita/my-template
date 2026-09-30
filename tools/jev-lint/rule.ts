import type { NoulQuestion } from "@typesafe-ai/sdk";

/** A yes/no question where yes means a violation. */
export interface Rule {
  id: string;
  question: NoulQuestion;
}
