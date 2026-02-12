import { ReviewDraft } from '@/types';

export function ReviewCard({ review }: { review: ReviewDraft }) {
  return (
    <article className="card">
      <h3>{review.title}</h3>
      <p>{review.summary}</p>
      <ul className="review-list">
        <li>
          <strong>Status:</strong> {review.status}
        </li>
        {review.dueDate && (
          <li>
            <strong>Due:</strong> {review.dueDate}
          </li>
        )}
        {review.priority && (
          <li>
            <strong>Priority:</strong> {review.priority}
          </li>
        )}
        <li>
          <strong>Contact:</strong> {review.contactName || 'Unknown'} ({review.contactPhone})
        </li>
      </ul>
      {review.transcript && (
        <details>
          <summary>תמלול</summary>
          <p>{review.transcript}</p>
        </details>
      )}
    </article>
  );
}
