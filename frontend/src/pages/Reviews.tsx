import { useState } from 'react';
import styled from 'styled-components';
import { motion } from 'framer-motion';
import { Star, Filter, ChevronDown, ChevronUp, Image } from 'lucide-react';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';

const PageContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 2rem;
  max-width: 1280px;
  margin: 0 auto;
`;

const PageHeader = styled.div`
  text-align: center;
  max-width: 48rem;
  margin: 0 auto;
`;

const PageTitle = styled.h1`
  font-size: 2.5rem;
  margin-bottom: 1rem;
  color: ${({ theme }) => theme.colors.neutral[900]};
`;

const PageDescription = styled.p`
  font-size: 1.125rem;
  color: ${({ theme }) => theme.colors.neutral[600]};
`;

const ReviewsContainer = styled.div``;

const FilterSection = styled.div`
  margin-bottom: 2rem;
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
  align-items: center;
  justify-content: space-between;
  
  @media (min-width: ${({ theme }) => theme.breakpoints.md}) {
    flex-wrap: nowrap;
  }
`;

const FilterGroup = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

const FilterLabel = styled.span`
  font-weight: ${({ theme }) => theme.fontWeights.medium};
  color: ${({ theme }) => theme.colors.neutral[700]};
`;

const SortDropdown = styled.div`
  position: relative;
`;

const SortButton = styled.button`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  background-color: white;
  border: 1px solid ${({ theme }) => theme.colors.neutral[200]};
  border-radius: ${({ theme }) => theme.radii.md};
  font-size: 0.875rem;
  font-weight: ${({ theme }) => theme.fontWeights.medium};
  color: ${({ theme }) => theme.colors.neutral[700]};
  cursor: pointer;
  transition: ${({ theme }) => theme.transitions.default};
  
  &:hover {
    background-color: ${({ theme }) => theme.colors.neutral[50]};
  }
`;

const SortMenu = styled(motion.div)`
  position: absolute;
  top: 100%;
  right: 0;
  margin-top: 0.25rem;
  background-color: white;
  border: 1px solid ${({ theme }) => theme.colors.neutral[200]};
  border-radius: ${({ theme }) => theme.radii.md};
  box-shadow: ${({ theme }) => theme.shadows.md};
  width: 12rem;
  z-index: 10;
  overflow: hidden;
`;

const SortMenuItem = styled.button<{ isActive: boolean }>`
  display: block;
  width: 100%;
  text-align: left;
  padding: 0.75rem 1rem;
  background-color: ${({ isActive, theme }) =>
    isActive ? theme.colors.primary[50] : 'white'};
  color: ${({ isActive, theme }) =>
    isActive ? theme.colors.primary[700] : theme.colors.neutral[700]};
  border: none;
  font-size: 0.875rem;
  cursor: pointer;
  transition: ${({ theme }) => theme.transitions.fast};
  
  &:hover {
    background-color: ${({ isActive, theme }) =>
      isActive ? theme.colors.primary[50] : theme.colors.neutral[50]};
  }
`;

const StarFilter = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

const StarButton = styled.button<{ isActive: boolean }>`
  display: flex;
  align-items: center;
  gap: 0.25rem;
  padding: 0.5rem 0.75rem;
  background-color: ${({ isActive, theme }) =>
    isActive ? theme.colors.primary[50] : 'white'};
  border: 1px solid ${({ isActive, theme }) =>
    isActive ? theme.colors.primary[500] : theme.colors.neutral[200]};
  border-radius: ${({ theme }) => theme.radii.md};
  font-size: 0.875rem;
  font-weight: ${({ theme }) => theme.fontWeights.medium};
  color: ${({ isActive, theme }) =>
    isActive ? theme.colors.primary[700] : theme.colors.neutral[700]};
  cursor: pointer;
  transition: ${({ theme }) => theme.transitions.default};
  
  &:hover {
    background-color: ${({ isActive, theme }) =>
      isActive ? theme.colors.primary[50] : theme.colors.neutral[50]};
  }
`;

const SearchBox = styled.div`
  flex: 1;
  max-width: 24rem;
`;

const ReviewsList = styled.div`
  display: grid;
  grid-template-columns: 1fr;
  gap: 2rem;
  margin-bottom: 3rem;
  
  @media (min-width: ${({ theme }) => theme.breakpoints.md}) {
    grid-template-columns: repeat(2, 1fr);
  }
`;

const ReviewCard = styled(Card)`
  display: flex;
  flex-direction: column;
`;

const ReviewHeader = styled.div`
  display: flex;
  justify-content: space-between;
  margin-bottom: 1rem;
`;

const ReviewAuthor = styled.div``;

const AuthorName = styled.h4`
  font-size: 1.125rem;
  margin-bottom: 0.25rem;
`;

const ReviewDate = styled.div`
  font-size: 0.875rem;
  color: ${({ theme }) => theme.colors.neutral[500]};
`;

const ReviewRating = styled.div`
  display: flex;
  align-items: center;
  gap: 0.25rem;
  color: ${({ theme }) => theme.colors.accent[500]};
`;

const ReviewContent = styled.div``;

const ReviewText = styled.p`
  margin-bottom: 1.5rem;
`;

const ReviewRoute = styled.div`
  font-size: 0.875rem;
  color: ${({ theme }) => theme.colors.neutral[600]};
  padding-top: 1rem;
  border-top: 1px solid ${({ theme }) => theme.colors.neutral[100]};
`;

const ReviewImages = styled.div`
  display: flex;
  gap: 0.5rem;
  overflow-x: auto;
  padding-bottom: 0.5rem;
  margin: 1rem 0;
  
  &::-webkit-scrollbar {
    height: 4px;
  }
  
  &::-webkit-scrollbar-track {
    background: ${({ theme }) => theme.colors.neutral[100]};
    border-radius: ${({ theme }) => theme.radii.full};
  }
  
  &::-webkit-scrollbar-thumb {
    background: ${({ theme }) => theme.colors.neutral[300]};
    border-radius: ${({ theme }) => theme.radii.full};
  }
`;

const ReviewImage = styled.img`
  width: 6rem;
  height: 6rem;
  object-fit: cover;
  border-radius: ${({ theme }) => theme.radii.md};
`;

const Pagination = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 0.5rem;
`;

const PageButton = styled.button<{ isActive?: boolean }>`
  width: 2.5rem;
  height: 2.5rem;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: ${({ theme }) => theme.radii.md};
  background-color: ${({ isActive, theme }) =>
    isActive ? theme.colors.primary[600] : 'white'};
  color: ${({ isActive, theme }) =>
    isActive ? 'white' : theme.colors.neutral[700]};
  border: 1px solid ${({ isActive, theme }) =>
    isActive ? theme.colors.primary[600] : theme.colors.neutral[200]};
  font-weight: ${({ theme }) => theme.fontWeights.medium};
  cursor: pointer;
  transition: ${({ theme }) => theme.transitions.default};
  
  &:hover {
    background-color: ${({ isActive, theme }) =>
      isActive ? theme.colors.primary[700] : theme.colors.neutral[50]};
  }
  
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const WriteReviewSection = styled.div`
  margin-top: 4rem;
`;

const SectionTitle = styled.h2`
  font-size: 1.75rem;
  margin-bottom: 1.5rem;
  text-align: center;
`;

const ReviewForm = styled.form`
  max-width: 48rem;
  margin: 0 auto;
`;

const FormGroup = styled.div`
  margin-bottom: 1.5rem;
`;

const TextArea = styled.textarea`
  width: 100%;
  padding: 0.75rem;
  border: 1px solid ${({ theme }) => theme.colors.neutral[300]};
  border-radius: ${({ theme }) => theme.radii.md};
  font-family: inherit;
  font-size: 0.9375rem;
  min-height: 10rem;
  resize: vertical;
  transition: ${({ theme }) => theme.transitions.default};
  
  &:focus {
    outline: none;
    border-color: ${({ theme }) => theme.colors.primary[500]};
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.15);
  }
`;

const RatingSelector = styled.div`
  display: flex;
  align-items: center;
  gap: 0.25rem;
  margin-bottom: 1rem;
`;

const RatingStar = styled.button<{ isActive: boolean }>`
  padding: 0.25rem;
  background: none;
  border: none;
  cursor: pointer;
  color: ${({ isActive, theme }) =>
    isActive ? theme.colors.accent[500] : theme.colors.neutral[300]};
  font-size: 1.5rem;
  line-height: 1;
  transition: ${({ theme }) => theme.transitions.fast};
  
  &:hover {
    color: ${({ theme }) => theme.colors.accent[500]};
  }
`;

const UploadButton = styled.label`
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.625rem 1rem;
  background-color: white;
  border: 1px solid ${({ theme }) => theme.colors.neutral[300]};
  border-radius: ${({ theme }) => theme.radii.md};
  color: ${({ theme }) => theme.colors.neutral[700]};
  font-weight: ${({ theme }) => theme.fontWeights.medium};
  cursor: pointer;
  transition: ${({ theme }) => theme.transitions.default};
  
  &:hover {
    background-color: ${({ theme }) => theme.colors.neutral[50]};
  }
  
  input {
    display: none;
  }
`;

const FormActions = styled.div`
  display: flex;
  justify-content: center;
  margin-top: 1.5rem;
`;

// Mock data for reviews
const mockReviews = [
  {
    id: 1,
    author: 'John Doe',
    date: '2023-05-15',
    rating: 5,
    text: 'This route was amazing! Beautiful scenery and well-maintained roads. The cost estimation was spot on, and I had no surprises during my journey. Highly recommended for anyone traveling from Boston to New York.',
    route: 'Boston to New York',
    images: [
      'https://images.pexels.com/photos/1563256/pexels-photo-1563256.jpeg?auto=compress&cs=tinysrgb&w=800',
      'https://images.pexels.com/photos/1268855/pexels-photo-1268855.jpeg?auto=compress&cs=tinysrgb&w=800',
    ],
  },
  {
    id: 2,
    author: 'Jane Smith',
    date: '2023-05-10',
    rating: 4,
    text: 'Great route overall, but there were a few unexpected delays due to construction. The cost estimation was accurate, and the alternative routes provided were helpful. Would use this service again for future trips.',
    route: 'Chicago to Detroit',
    images: [],
  },
  {
    id: 3,
    author: 'Robert Johnson',
    date: '2023-05-08',
    rating: 3,
    text: 'Decent route, but I encountered more traffic than expected. The cost estimation was a bit off, and I ended up spending more on tolls than anticipated. The scenery was nice though, and the overall experience was positive.',
    route: 'San Francisco to Los Angeles',
    images: [
      'https://images.pexels.com/photos/1470405/pexels-photo-1470405.jpeg?auto=compress&cs=tinysrgb&w=800',
    ],
  },
  {
    id: 4,
    author: 'Emily Davis',
    date: '2023-05-05',
    rating: 5,
    text: 'Fantastic route! The directions were clear, and the alternative routes provided were very helpful when I encountered traffic. The cost estimation was accurate, and I saved money by following the eco-friendly route. Highly recommended!',
    route: 'Seattle to Portland',
    images: [
      'https://images.pexels.com/photos/2526025/pexels-photo-2526025.jpeg?auto=compress&cs=tinysrgb&w=800',
      'https://images.pexels.com/photos/1252426/pexels-photo-1252426.jpeg?auto=compress&cs=tinysrgb&w=800',
    ],
  },
];

const Reviews = () => {
  const [starFilter, setStarFilter] = useState<number | null>(null);
  const [sortOption, setSortOption] = useState('newest');
  const [showSortMenu, setShowSortMenu] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [rating, setRating] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');

  const handleStarFilter = (stars: number) => {
    if (starFilter === stars) {
      setStarFilter(null);
    } else {
      setStarFilter(stars);
    }
  };

  const handleSortChange = (option: string) => {
    setSortOption(option);
    setShowSortMenu(false);
  };

  const handleRatingChange = (value: number) => {
    setRating(value);
  };

  const handleSubmitReview = (e: React.FormEvent) => {
    e.preventDefault();
    // In a real app, this would submit the review to the API
    alert('Review submitted successfully!');
  };

  // Filter and sort reviews
  let filteredReviews = [...mockReviews];
  
  if (starFilter) {
    filteredReviews = filteredReviews.filter(review => review.rating === starFilter);
  }
  
  if (searchTerm) {
    filteredReviews = filteredReviews.filter(review => 
      review.text.toLowerCase().includes(searchTerm.toLowerCase()) ||
      review.author.toLowerCase().includes(searchTerm.toLowerCase()) ||
      review.route.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }
  
  // Sort reviews
  if (sortOption === 'newest') {
    filteredReviews.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  } else if (sortOption === 'oldest') {
    filteredReviews.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  } else if (sortOption === 'highest') {
    filteredReviews.sort((a, b) => b.rating - a.rating);
  } else if (sortOption === 'lowest') {
    filteredReviews.sort((a, b) => a.rating - b.rating);
  }

  return (
    <PageContainer>
      <PageHeader>
        <PageTitle>Traveler Reviews</PageTitle>
        <PageDescription>
          Read authentic reviews from fellow travelers to make informed decisions 
          about routes and services. Share your own experiences to help others.
        </PageDescription>
      </PageHeader>

      <ReviewsContainer>
        <FilterSection>
          <FilterGroup>
            <FilterLabel>Filter:</FilterLabel>
            <StarFilter>
              {[5, 4, 3, 2, 1].map(stars => (
                <StarButton
                  key={stars}
                  isActive={starFilter === stars}
                  onClick={() => handleStarFilter(stars)}
                >
                  <Star size={16} fill={starFilter === stars ? 'currentColor' : 'none'} />
                  {stars}
                </StarButton>
              ))}
            </StarFilter>
          </FilterGroup>
          
          <SearchBox>
            <Input
              placeholder="Search reviews..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              fullWidth
            />
          </SearchBox>
          
          <SortDropdown>
            <SortButton onClick={() => setShowSortMenu(!showSortMenu)}>
              <Filter size={16} />
              Sort: {sortOption === 'newest' ? 'Newest' : 
                     sortOption === 'oldest' ? 'Oldest' :
                     sortOption === 'highest' ? 'Highest Rated' : 'Lowest Rated'}
              {showSortMenu ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </SortButton>
            
            {showSortMenu && (
              <SortMenu
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
              >
                <SortMenuItem
                  isActive={sortOption === 'newest'}
                  onClick={() => handleSortChange('newest')}
                >
                  Newest First
                </SortMenuItem>
                <SortMenuItem
                  isActive={sortOption === 'oldest'}
                  onClick={() => handleSortChange('oldest')}
                >
                  Oldest First
                </SortMenuItem>
                <SortMenuItem
                  isActive={sortOption === 'highest'}
                  onClick={() => handleSortChange('highest')}
                >
                  Highest Rated
                </SortMenuItem>
                <SortMenuItem
                  isActive={sortOption === 'lowest'}
                  onClick={() => handleSortChange('lowest')}
                >
                  Lowest Rated
                </SortMenuItem>
              </SortMenu>
            )}
          </SortDropdown>
        </FilterSection>

        <ReviewsList>
          {filteredReviews.map(review => (
            <ReviewCard key={review.id} variant="elevated">
              <ReviewHeader>
                <ReviewAuthor>
                  <AuthorName>{review.author}</AuthorName>
                  <ReviewDate>{new Date(review.date).toLocaleDateString()}</ReviewDate>
                </ReviewAuthor>
                <ReviewRating>
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      size={18}
                      fill={i < review.rating ? 'currentColor' : 'none'}
                    />
                  ))}
                </ReviewRating>
              </ReviewHeader>
              
              <ReviewContent>
                <ReviewText>{review.text}</ReviewText>
                
                {review.images.length > 0 && (
                  <ReviewImages>
                    {review.images.map((image, index) => (
                      <ReviewImage key={index} src={image} alt={`Review image ${index + 1}`} />
                    ))}
                  </ReviewImages>
                )}
                
                <ReviewRoute>Route: {review.route}</ReviewRoute>
              </ReviewContent>
            </ReviewCard>
          ))}
        </ReviewsList>

        <Pagination>
          <PageButton
            disabled={currentPage === 1}
            onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
          >
            &lt;
          </PageButton>
          {[1, 2, 3].map(page => (
            <PageButton
              key={page}
              isActive={currentPage === page}
              onClick={() => setCurrentPage(page)}
            >
              {page}
            </PageButton>
          ))}
          <PageButton
            disabled={currentPage === 3}
            onClick={() => setCurrentPage(prev => Math.min(prev + 1, 3))}
          >
            &gt;
          </PageButton>
        </Pagination>

        <WriteReviewSection>
          <SectionTitle>Share Your Experience</SectionTitle>
          <ReviewForm onSubmit={handleSubmitReview}>
            <FormGroup>
              <label htmlFor="rating">Rating</label>
              <RatingSelector>
                {[1, 2, 3, 4, 5].map(value => (
                  <RatingStar
                    key={value}
                    type="button"
                    isActive={value <= rating}
                    onClick={() => handleRatingChange(value)}
                  >
                    <Star fill={value <= rating ? 'currentColor' : 'none'} />
                  </RatingStar>
                ))}
              </RatingSelector>
            </FormGroup>
            
            <FormGroup>
              <Input
                label="Route"
                placeholder="e.g., Boston to New York"
                fullWidth
              />
            </FormGroup>
            
            <FormGroup>
              <label htmlFor="review">Your Review</label>
              <TextArea
                id="review"
                placeholder="Share your experience with this route..."
              />
            </FormGroup>
            
            <FormGroup>
              <label>Add Photos (Optional)</label>
              <UploadButton>
                <Image size={18} />
                Upload Images
                <input type="file" multiple accept="image/*" />
              </UploadButton>
              <p style={{ fontSize: '0.75rem', marginTop: '0.5rem', color: '#6b7280' }}>
                Max 5 images, 5MB each
              </p>
            </FormGroup>
            
            <FormActions>
              <Button type="submit">Submit Review</Button>
            </FormActions>
          </ReviewForm>
        </WriteReviewSection>
      </ReviewsContainer>
    </PageContainer>
  );
};

export default Reviews;