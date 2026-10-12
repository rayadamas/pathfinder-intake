/**
 * Signals read from free text. When a person types instead of tapping, each
 * matching pattern adds points to a service, and the person's exact words
 * are stored as the evidence.
 *
 * [pattern, serviceKey, points, reason]
 */
export const KEYWORDS = [
  [/electric|energy|utilit|power bill|heating|cooling|solar/i, 'solar',    2, 'Brought up energy costs'],
  [/debt|credit card|loan|collections|behind on/i,            'relief',   3, 'Brought up debt'],
  [/tight|paycheck|stress|afford|bills|struggl/i,             'relief',   2, 'Described money pressure'],
  [/promot|raise|career|new job|switch|industry|certif|degree|skill|boss/i, 'career', 2, 'Talked about career moves'],
  [/business|clients|customers|side hustle|freelanc|launch|my own/i, 'business', 2, 'Talked about building a business'],
  [/invest|stock|401k|ira|portfolio|crypto/i,                 'invest',   2, 'Brought up investing'],
  [/retire|saving|save |emergency fund|budget|plan/i,         'planning', 2, 'Talked about saving or planning'],
  [/kid|child|son|daughter|baby|family|mom|dad|parent/i,      'protect',  1, 'Family came up'],
  [/roof|kitchen|repair|renovat|remodel|basement|furnace|windows/i, 'equity', 2, 'Mentioned home projects'],
  [/buy a (house|home)|first home|down payment|own a home/i,  'homebuy',  3, 'Wants to buy a home']
];
