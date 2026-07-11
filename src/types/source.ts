export type SourceType = 'past-paper' | 'official' | 'textbook' | 'teacher-handout' | 'generated' | 'pending-review';

export interface SourceRecord {
  id: string;
  title: string;
  sourceType: SourceType;
  priority: number;
  version: string | null;
  isPrivate: boolean;
  reviewedByHuman: boolean;
  notes: string;
}
