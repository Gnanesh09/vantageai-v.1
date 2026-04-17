"use client";
import { useState } from "react";
import { Star } from "lucide-react";

interface Review {
  id: string;
  author: string;
  rating: number;
  content: string;
  date: string;
}

export default function Reviews({ productId }: { productId: string }) {
  const [reviews, setReviews] = useState<Review[]>([
    { id: "1", author: "Alex D.", rating: 5, content: "Absolutely fantastic quality. Fast shipping too!", date: "2 days ago" },
    { id: "2", author: "Sarah M.", rating: 4, content: "Great product, matches the description exactly. Dropped a star because the packaging was slightly dented.", date: "1 week ago" }
  ]);
  const [newReview, setNewReview] = useState("");
  const [newRating, setNewRating] = useState(5);
  const [showForm, setShowForm] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newReview.trim()) return;
    
    setReviews([{
      id: Date.now().toString(),
      author: "Guest User",
      rating: newRating,
      content: newReview,
      date: "Just now"
    }, ...reviews]);
    
    setNewReview("");
    setShowForm(false);
  };

  return (
    <div className="mt-16 border-t border-gray-100 pt-10">
      <div className="flex items-center justify-between mb-8">
        <h2 className="text-2xl font-black text-gray-900">Customer Reviews</h2>
        <button onClick={() => setShowForm(!showForm)} className="bg-brand-light/30 text-brand font-bold py-2 px-4 rounded-lg hover:bg-brand hover:text-white transition-colors">
          Write a Review
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="bg-gray-50 p-6 rounded-2xl mb-8 animate-in fade-in slide-in-from-top-4">
          <h3 className="font-bold text-gray-800 mb-4">Submit your review</h3>
          
          <div className="flex items-center gap-2 mb-4">
            <span className="text-sm font-semibold text-gray-600">Rating:</span>
            <div className="flex">
              {[1,2,3,4,5].map(star => (
                <Star 
                  key={star} 
                  className={`w-6 h-6 cursor-pointer hover:scale-110 transition-transform ${star <= newRating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`}
                  onClick={() => setNewRating(star)}
                />
              ))}
            </div>
          </div>
          
          <textarea 
            required
            autoFocus
            value={newReview}
            onChange={(e) => setNewReview(e.target.value)}
            placeholder="What did you like or dislike? What is this product used for?"
            className="w-full p-4 border border-gray-200 rounded-xl mb-4 focus:ring-2 focus:ring-brand outline-none resize-none min-h-[100px]"
          />
          <div className="flex justify-end gap-2">
            <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 text-gray-500 font-bold hover:bg-gray-200 rounded-lg">Cancel</button>
            <button type="submit" className="bg-brand text-white font-bold py-2 px-6 rounded-lg shadow hover:bg-brand-dark transition-colors">Submit</button>
          </div>
        </form>
      )}

      <div className="flex flex-col gap-6">
        {reviews.map(review => (
          <div key={review.id} className="border-b border-gray-100 pb-6 last:border-0">
            <div className="flex items-center justify-between mb-2">
              <span className="font-bold text-gray-900">{review.author}</span>
              <span className="text-sm text-gray-400">{review.date}</span>
            </div>
            <div className="flex mb-3">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className={`w-4 h-4 ${i < review.rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-200'}`} />
              ))}
            </div>
            <p className="text-gray-600 text-sm leading-relaxed">{review.content}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
