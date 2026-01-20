// Reusable UI: ReviewForm placeholder
export function ReviewForm() {
  return (
    <form>
      <label>
        Review
        <textarea rows={4} style={{ display: 'block', width: '100%' }} />
      </label>
      <button type="submit">Submit</button>
    </form>
  );
}
