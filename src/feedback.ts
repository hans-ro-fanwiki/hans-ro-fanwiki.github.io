const FORM_URL = 'https://tally.so/r/9N7OlX';

export function feedbackUrl(pageUrl: string, cardId?: number): string {
 const form = new URL(FORM_URL);
 form.searchParams.set('page_id',pageUrl);
 if (cardId !== undefined) form.searchParams.set('card_id',String(cardId));
 return form.toString();
}
