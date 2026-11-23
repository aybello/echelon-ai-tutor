import { ArrowUpRight, Star } from "lucide-react";

/** Sources: owner-supplied November 18 transcript, Codie's five-star rating confirmed by owner November 23, and public Google listing checked November 20, 2026. */
export default function LearnerReviews() {
  return <section id="reviews" className="homepage-section homepage-reviews" aria-labelledby="homepage-reviews-title">
    <div className="homepage-section-heading homepage-section-heading-left">
      <span className="homepage-kicker">From Echelon learners</span>
      <h2 id="homepage-reviews-title">Learning that fits around the job.</h2>
      <p>Real experiences from learners using Echelon to prepare.</p>
    </div>
    <figure className="homepage-review-card">
      <div className="flex gap-1 text-amber-500" role="img" aria-label="5 out of 5 stars">
        {Array.from({ length: 5 }, (_, index) => <Star key={index} size={20} fill="currentColor" aria-hidden="true" />)}
      </div>
      <blockquote>
        <p>“I am having great success with it. I do enjoy it.”</p>
        <p>“It's nice to have this digital program where you don't have to be on a computer. You can jump on your phone, you don't have to lug around a study textbook.”</p>
      </blockquote>
      <figcaption>
        <strong>Codie Bachner</strong>
        <span>Class 1 Wastewater learner · City of Peterborough</span>
      </figcaption>
    </figure>
    <figure className="homepage-review-card">
      <div className="flex gap-1 text-amber-500" role="img" aria-label="5 out of 5 stars">
        {Array.from({ length: 5 }, (_, index) => <Star key={index} size={20} fill="currentColor" aria-hidden="true" />)}
      </div>
      <blockquote cite="https://www.google.com/maps/place/?q=place_id:ChIJ_eBKhGWFK4gRayMFuRSVLys&hl=en">
        <p>“I have to retake my OIT certificate because it expired a long time ago. These mok questions are great, they explain if you got a question wrong along with what the correct answer is. I will be studying with this for sure.”</p>
      </blockquote>
      <figcaption>
        <strong>Canadian Veggie</strong>
        <span>Google reviewer · 5 stars</span>
        <small>Public Google review, checked November 20, 2026. Original wording.</small>
      </figcaption>
    </figure>
    <a href="https://www.google.com/maps/place/?q=place_id:ChIJ_eBKhGWFK4gRayMFuRSVLys&hl=en" target="_blank" rel="noopener noreferrer" className="homepage-text-link">
      Read reviews on Google <ArrowUpRight size={16} aria-hidden="true" /><span className="sr-only">(opens in a new tab)</span>
    </a>
  </section>;
}
