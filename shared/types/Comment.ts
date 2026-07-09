export interface Comment {
  author: string;
  role: string;
  time: string;
  text: string;
  sentiment: 'positive' | 'neutral' | 'negative';
}
