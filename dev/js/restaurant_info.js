let restaurant;
let map;



/**
 * Initialize Google map, called from HTML.
 */
window.initMap = () => {
  fetchRestaurantFromURL((error, restaurant) => {
    if (error) { // Got an error!
      console.error(error);
    } else {
      self.map = new google.maps.Map(document.getElementById('map'), {
        zoom: 16,
        center: restaurant.latlng,
        scrollwheel: false
      });
      fillBreadcrumb();
      DBHelper.mapMarkerForRestaurant(self.restaurant, self.map);
    }
  });
}

document.addEventListener("DOMContentLoaded", function(){
    let form = document.getElementById('add-review-form');
    form.addEventListener('submit', function(e) {
        e.preventDefault();
        submitReviewForm();
    });
    window.addEventListener('online',clearOffPendingReviews);

});

submitReviewForm = () => {
  let review = {};
  let form = document.getElementById('add-review-form');
  review['restaurant_id']=self.restaurant.id;
  let revierName = document.getElementById('reviewerName').value;
  let reviewerRating = document.getElementById('reviewerRating').value;
  let reviewerComment = document.getElementById('reviewerComment').value;
  review['name']=revierName;
  review['rating']=reviewerRating;
  review['comments']=reviewerComment;
  review['createdAt']=Date.now();

  DBHelper.submitReview(review);

  document.getElementById('reviewerName').value='';
  document.getElementById('reviewerRating').value='0';
  document.getElementById('reviewerComment').value='';


    const reviewList = document.getElementById('reviews-list');
    let listItem = document.createDocumentFragment();
    listItem.append(createReviewHTML(review));
    reviewList.appendChild(listItem);

};


clearOffPendingReviews = () => {
    console.log('bin wieder online!');
    DBHelper.getPendingReviews().then(reviews=>{
        DBHelper.removePendingReviews().then(()=>{//TODO: FIX OBJECT THAT IS BEING SENT
            reviews.forEach((review)=>{
                let modeledReview = {};
                modeledReview['restaurant_id']=review.data.restaurant_id;
                modeledReview['name']=review.data.name;
                modeledReview['rating']=review.data.rating;
                modeledReview['comments']=review.data.comments;
                modeledReview['createdAt']=review.data.createdAt;

                DBHelper.submitReview(modeledReview)
            });
        })
    });
}

/**
 * Get current restaurant from page URL.
 */
fetchRestaurantFromURL = (callback) => {
  if (self.restaurant) { // restaurant already fetched!
    callback(null, self.restaurant)
    return;
  }
  const id = getParameterByName('id');
  if (!id) { // no id found in URL
    error = 'No restaurant id in URL'
    callback(error, null);
  } else {
    DBHelper.fetchRestaurantById(id, (error, restaurant) => {
      self.restaurant = restaurant;
      if (!restaurant) {
        console.error(error);
        return;
      }
      DBHelper.fetchReviewsById(id,(error,reviews)=>{
        self.reviews = reviews;
        if(!reviews){
          console.error(error);
          return;
        }
      });

      fillRestaurantHTML();
      //fillReviewsHTML();
      callback(null, restaurant)
    });
  }
}

/**
 * Create restaurant HTML and add it to the webpage
 */
fillRestaurantHTML = (restaurant = self.restaurant) => {
  const name = document.getElementById('restaurant-name');
  name.innerHTML = restaurant.name;
  name.setAttribute("tabindex","0");

  if(self.restaurant.is_favorite=='true'){
      console.log('Restaurant is favorite');
      name.innerHTML+=`<button tabindex="0" aria-label="Remove favorite mark" onclick="markFavorite(this)" class="favorite"></button>`;
  }else{
    console.log('Restaurant is not a favorite');
      name.innerHTML+=`<button tabindex="0" aria-label="Mark as favorite" onclick="markFavorite(this)" class="un_favorite"></button>`;
  }

  const address = document.getElementById('restaurant-address');
  address.innerHTML = restaurant.address;
  address.setAttribute("tabindex","0");

  const image = document.getElementById('restaurant-img');
  image.className = 'restaurant-img'
  ResponsiveHelper.createResponsiveImageBlock(restaurant,image);

  const cuisine = document.getElementById('restaurant-cuisine');
  cuisine.innerHTML = restaurant.cuisine_type;
  cuisine.setAttribute("tabindex","0");

  // fill operating hours
  if (restaurant.operating_hours) {
    fillRestaurantHoursHTML();
  }
  // fill reviews
  fillReviewsHTML();
}
markFavorite=(element)=>{

    if(self.restaurant.is_favorite ==='true') {
        element.classList.remove('favorite');
        element.classList.add('un_favorite');
        self.restaurant.is_favorite ='false';
        element.removeAttribute('aria-label');
        element.setAttribute('aria-label','Mark as favorite');

    } else {
        self.restaurant.is_favorite ='true';
        element.removeAttribute('aria-label');
        element.setAttribute('aria-label','Remove favorite mark');
        element.classList.remove('un_favorite');
        element.classList.add('favorite');
    }

    DBHelper.markAsFavorite(self.restaurant);
}

/**
 * Create restaurant operating hours HTML table and add it to the webpage.
 */
fillRestaurantHoursHTML = (operatingHours = self.restaurant.operating_hours) => {
  const hours = document.getElementById('restaurant-hours');
  for (let key in operatingHours) {
    const row = document.createElement('tr');

    const day = document.createElement('td');
    day.innerHTML = key;
    day.setAttribute("tabindex","0");
    row.appendChild(day);

    const time = document.createElement('td');
    time.innerHTML = operatingHours[key];
    time.setAttribute("tabindex","0");
    row.appendChild(time);

    hours.appendChild(row);
    hours.setAttribute("tabindex","0");
  }
}

/**
 * Create all reviews HTML and add them to the webpage.
 */
fillReviewsHTML = (reviews = self.reviews) => {

  if(self.restaurant.reviews){
    generateReviewHTML(self.restaurant.reviews);

  }else{
    DBHelper.fetchReviewsByRestaurantId(self.restaurant.id,(error,reviewList)=>{
      if(reviewList){
        self.restaurant.reviews = reviewList;
        generateReviewHTML(self.restaurant.reviews);
      }else{
        console.log("No review data has been pulled!");
      }
    });
  }
}

generateReviewHTML = (allReviews) => {
  const reviewList = document.getElementById('reviews-list');
  let listItem = document.createDocumentFragment();

  if(allReviews && allReviews.length==0){
    let errorMessage = document.createElement('p');
    errorMessage.innerHTML='There are not reviews yet!';
    reviewList.appendChild(errorMessage);
    return;
  }
  allReviews.forEach(review =>{
    listItem.append(createReviewHTML(review));
  });

  reviewList.appendChild(listItem);

}



/**
 * Create review HTML and add it to the webpage.
 */
createReviewHTML = (review) => {
  const li = document.createElement('li');

  const header = document.createElement('div');
  header.classList.add('review-header');
  li.append(header);

  const name = document.createElement('p');
  name.classList.add('reviewer-name');
  name.innerHTML = review.name;
  name.setAttribute("tabindex","0");
  header.appendChild(name);

  const date = document.createElement('p');
  date.classList.add('reviewer-date')
  date.innerHTML = new Date(review.updatedAt).toDateString();
  date.setAttribute("tabindex","0");
  header.appendChild(date);

  const rating = document.createElement('p');
  rating.classList.add('reviewer-rating');
  rating.classList.add('rating-'+review.rating);
  rating.innerHTML = `Rating: ${review.rating}`;
  rating.setAttribute("tabindex","0");
  li.appendChild(rating);

  const comments = document.createElement('p');
  comments.classList.add('reviewer-comment')
  comments.innerHTML = review.comments;
  comments.setAttribute("tabindex","0");
  li.appendChild(comments);

  return li;
}

/**
 * Add restaurant name to the breadcrumb navigation menu
 */
fillBreadcrumb = (restaurant=self.restaurant) => {
  const breadcrumb = document.getElementById('breadcrumb');
  const li = document.createElement('li');
  li.innerHTML = restaurant.name;
  breadcrumb.appendChild(li);
}

/**
 * Get a parameter by name from page URL.
 */
getParameterByName = (name, url) => {
  if (!url)
    url = window.location.href;
  name = name.replace(/[\[\]]/g, '\\$&');
  const regex = new RegExp(`[?&]${name}(=([^&#]*)|&|#|$)`),
    results = regex.exec(url);
  if (!results)
    return null;
  if (!results[2])
    return '';
  return decodeURIComponent(results[2].replace(/\+/g, ' '));
}
