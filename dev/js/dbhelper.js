
/**
 * Common database helper functions.
 */
let dbPromise;
class DBHelper {

    /**
     * Database URL.
     * Change this to restaurants.json file location on your server.
     */
    static get DATABASE_URL() {
        const port = 1337 // Change this to your server port
        return `http://localhost:${port}/restaurants`;
    }
    /**
     * Review URL.
     * Get URL for Review URL for Restaurant
     */
    static get REVIEW_URL(){
        const port=1337;
        return `http://localhost:${port}/reviews/?restaurant_id=`;
    }
    /**
     * REVIEW POST URL.
     * Get URL where to post new reviews.
     */
    static get REVIEW_POST_URL(){
        const port=1337;
        return `http://localhost:${port}/reviews`;
    }
    /**
     * open Database.
     * Method to open the databaseconnection
     * */
    static openDatabase() {
        idb.open('restaurants', 1, function (upgradeDb) {
            var restaurants = upgradeDb.createObjectStore('restaurants', {
                keyPath: 'id'
            });
            var reviews = upgradeDb.createObjectStore('reviews', {
                keyPath: 'id'
            });
            var pending_reviews = upgradeDb.createObjectStore('pending_reviews', {
                keyPath:'id', autoIncrement:true
            });
            restaurants.createIndex('id', 'id');
            reviews.createIndex('restaurant_id', 'restaurant_id');

        });
        return idb.open('restaurants',1);
    }

    /**
     * Fetch all restaurants.
     */
    static fetchRestaurantsFetch(callback){
        //check if there is cached data, if return the data asap
        DBHelper.getCachedMessages().then(function(data){
            if(data.length > 0){
                return callback(null , data);
            }
            // fetch data from the network, so db is updated with data
            fetch(DBHelper.DATABASE_URL , {credentials:'same-origin'})
                .then(res => res.json())
                .then(data => {
                    dbPromise.then(function(db){
                        var transaction = db.transaction('restaurants' , 'readwrite');
                        var store = transaction.objectStore('restaurants');
                        data.forEach(restaurant => store.put(restaurant));

                        store.openCursor(null , 'prev').then(function(cursor){
                            return cursor.advance(100);
                        })
                            .then(function deleteRest(cursor){
                                if(!cursor) {
                                    return;
                                }
                                cursor.delete();
                                return cursor.continue().then(deleteRest);
                            });
                    });
                    return callback(null,data);
                })
                .catch(err => {
                    return callback(err , null)
                });
        });
    }
    /**
     * mark as Favorite
     * Put status to backend
     */

    static markAsFavorite(restaurant){
        let actState = restaurant.is_favorite;
        let url=DBHelper.DATABASE_URL+'/'+restaurant.id;
        if(actState=='true'){
            url += '?is_favorite=true';
        }else{
            url+='?is_favorite=false';
        }
        return fetch(url,{method:'PUT'})
            .then(function (response) {
                if(response.ok) {
                    return response.json();
                } else {
                    return [{}];
                }
            });

    }
    /**
     * fetchReviews.
     * fetchAllReviews(deprecated) was experimental
     */

    static fetchReviews(callback){
        DBHelper.getCachedReviews().then(function(data){
            if(data.length > 0){
                return callback(null,data);
            }
            fetch(DBHelper.REVIEW_URL,{credentials:'same-origin'})
                .then(res=>res.json())
                .then(data =>{
                    var ergebnis;
                    dbPromise.then(function(db){
                        /*
                        * let tx = db.transaction('reviews');
        let store = tx.objectStore('reviews').index('restaurant');
        return store.getAll(parseInt(id))*/
                        var transaction = db.transaction('reviews','readwrite');
                        var store = transaction.objectStore('reviews').index('restaurant_id');
                        ergebnis = store.getAll(parseInt(getParameterByName('id')));
                        return callback(null,ergebnis);

                    });
                    //return callback(null,ergebnis);
                })
                .catch(err=>{
                    return callback(err,null)
                });
        });
    }
    /**
     * Get all the cached messages
     */
    static getCachedMessages(){
        dbPromise = DBHelper.openDatabase();
        return dbPromise.then(function(db){
            var transaction = db.transaction('restaurants');
            var objectStore = transaction.objectStore('restaurants');
            return objectStore.getAll();
        });
    }
    /**
     *
     * get all cachedReviews
     */
    static getCachedReviews(){
        dbPromise = DBHelper.openDatabase();
        return dbPromise.then(function(db){
            var transaction = db.transaction('reviews');
            var objectStore= transaction.objectStore('reviews');
            return objectStore.getAll();
        });
    }


    /**
     * Fetch a restaurant by its ID.
     */
    static fetchRestaurantById(id, callback) {
        // fetch all restaurants with proper error handling.
        DBHelper.fetchRestaurantsFetch((error, restaurants) => {
            if (error) {
                callback(error, null);
            } else {
                const restaurant = restaurants.find(r => r.id == id);
                if (restaurant) { // Got the restaurant
                    callback(null, restaurant);
                } else { // Restaurant does not exist in the database
                    callback('Restaurant does not exist', null);
                }
            }
        });
    }

    static fetchReviewsById(id,callback){
       DBHelper.openDatabase()
           .then(database =>{
               if(!database){
                   return;
               }
               return database.transaction('reviews').objectStore('reviews').getAll();
           })
           .then(reviewData =>{
               reviewData = reviewData.filter(review => review.restaurant_id==id);
               if(reviewData && reviewData.length>0){
                   return callback(null,reviewData);
               }else{
                   fetch(DBHelper.REVIEW_URL+id)
                       .then(response =>{
                           if(response.status!=200){
                               console.log("Error has occured, couldn't load reviews!");
                           }else{
                               return response.json();
                           }
                       })
                       .then(reviews=>{
                           DBHelper.openDatabase().then(database=>{
                               if(!database){
                                   return;
                               }
                               let store = database.transaction('reviews','readwrite').objectStore('reviews');
                               if(reviews && reviews.length>0){
                                   reviews.map(review=>{
                                       store.put(review);
                                   });
                               }
                           });
                           return callback(null,reviews);
                       });
               }
           });
        }

        static fetchReviewsByRestaurantId(id,callback){
        DBHelper.fetchReviewsById(id,(error,reviews) => {
            if(!error){
                let allReviews = reviews;
                if(allReviews && allReviews.length>0){
                    callback(null,allReviews);
                }else{
                    callback('missing reviews for this restaurant',null);
                }
            }else{
                callback(error,null);
            }
        });
        }

    /**
     * Submit review
     */
    static submitReview(review){
        let headers = new Headers().set('Accept','application/json');
        let formData = JSON.stringify(review);

        let url = DBHelper.REVIEW_POST_URL;
        let options = {
            method:'POST',
            headers,
            body:formData
        };

        let resp = fetch(url,options);
        resp.then((response) => response.json())
            .then(review =>{
                //TODO: METHOD for reloadReviews
                DBHelper.reloadReviews(review.restaurant_id);
            }).catch(exception => {
                console.log("exception occured "+exception);
                //propably offline so store the review for next run
            //TODO: Methode für offline speichern von Reviews
            DBHelper.saveReview(review);
            //TEMPLATE IST JETZT MWS_RESTAURANT_STAGE_1_MASTER
        })

    }
    //offlinereviews
    static getPendingReviews(){
        return new Promise((resolve,reject) => {
            DBHelper.openDatabase().then(db => {
                let tx = db.transaction("pending_reviews");
                let store = tx.objectStore("pending_reviews");
                store.getAll().then(data => {
                    return resolve(data);
                }).catch(e => {
                    reject(e);
                });
            })
        })

    }

    //clearoffreviews
    static removePendingReviews(){
        return new Promise((resolve, reject) => {
            DBHelper.openDatabase().then(db => {
                var tx = db.transaction("pending_reviews", "readwrite");
                tx.objectStore("pending_reviews").clear();
                return resolve();
            }).catch(reject);
        });

    }

    static reloadReviews(id){
        return new Promise((resolve,reject)=>{
            fetch(DBHelper.REVIEW_URL+self.restaurant.id)
                .then(response => {
                    response.json()
                        .then(data=>{
                            DBHelper.openDatabase()
                                .then(db=>{
                                    let tx = db.transaction('reviews','readwrite');
                                    let store = tx.objectStore('reviews');
                                    data.forEach(element => {
                                        element.restaurant_id = parseInt(element.restaurant_id);
                                        element.rating = parseInt(element.rating);
                                        store.put(element);
                                    });
                                });
                            let event = new CustomEvent("reviews_updated", {detail: {restaurant_id: id}});
                            document.dispatchEvent(event);
                            return resolve(data);
                        });
                });

        })
    }

    static saveReview(review){
        DBHelper.openDatabase().then(database=>{
            let tx = database.transaction('pending_reviews','readwrite');
            let store = tx.objectStore('pending_reviews');
            store.add({id: Date.now(), data: review});
        })
    }

    /**
     * Fetch restaurants by a cuisine type with proper error handling.
     */
    static fetchRestaurantByCuisine(cuisine, callback) {
        // Fetch all restaurants  with proper error handling
        DBHelper.fetchRestaurantsFetch((error, restaurants) => {
            if (error) {
                callback(error, null);
            } else {
                // Filter restaurants to have only given cuisine type
                const results = restaurants.filter(r => r.cuisine_type == cuisine);
                callback(null, results);
            }
        });
    }

    /**
     * Fetch restaurants by a neighborhood with proper error handling.
     */
    static fetchRestaurantByNeighborhood(neighborhood, callback) {
        // Fetch all restaurants
        DBHelper.fetchRestaurantsFetch((error, restaurants) => {
            if (error) {
                callback(error, null);
            } else {
                // Filter restaurants to have only given neighborhood
                const results = restaurants.filter(r => r.neighborhood == neighborhood);
                callback(null, results);
            }
        });
    }

    /**
     * Fetch restaurants by a cuisine and a neighborhood with proper error handling.
     */
    static fetchRestaurantByCuisineAndNeighborhood(cuisine, neighborhood, callback) {
        // Fetch all restaurants
        DBHelper.fetchRestaurantsFetch((error, restaurants) => {
            if (error) {
                callback(error, null);
            } else {
                let results = restaurants
                if (cuisine != 'all') { // filter by cuisine
                    results = results.filter(r => r.cuisine_type == cuisine);
                }
                if (neighborhood != 'all') { // filter by neighborhood
                    results = results.filter(r => r.neighborhood == neighborhood);
                }
                callback(null, results);
            }
        });
    }

    /**
     * Fetch all neighborhoods with proper error handling.
     */
    static fetchNeighborhoods(callback) {
        // Fetch all restaurants
        DBHelper.fetchRestaurantsFetch((error, restaurants) => {
            if (error) {
                callback(error, null);
            } else {
                // Get all neighborhoods from all restaurants
                const neighborhoods = restaurants.map((v, i) => restaurants[i].neighborhood)
                // Remove duplicates from neighborhoods
                const uniqueNeighborhoods = neighborhoods.filter((v, i) => neighborhoods.indexOf(v) == i)
                callback(null, uniqueNeighborhoods);
            }
        });
    }

    /**
     * Fetch all cuisines with proper error handling.
     */
    static fetchCuisines(callback) {
        // Fetch all restaurants
        DBHelper.fetchRestaurantsFetch((error, restaurants) => {
            if (error) {
                callback(error, null);
            } else {
                // Get all cuisines from all restaurants
                const cuisines = restaurants.map((v, i) => restaurants[i].cuisine_type)
                // Remove duplicates from cuisines
                const uniqueCuisines = cuisines.filter((v, i) => cuisines.indexOf(v) == i)
                callback(null, uniqueCuisines);
            }
        });
    }

    /**
     * Restaurant page URL.
     */
    static urlForRestaurant(restaurant) {
        return (`./restaurant.html?id=${restaurant.id}`);
    }

    /**
     * Restaurant image URL.
     *//*
 static imageUrlForRestaurant(restaurant) {
 return (`/img/${restaurant.photograph}`);
 }*/

    /**
     * Map marker for a restaurant.
     */
    static mapMarkerForRestaurant(restaurant, map) {
        const marker = new google.maps.Marker({
            position: restaurant.latlng,
            title: restaurant.name,
            url: DBHelper.urlForRestaurant(restaurant),
            map: map,
            animation: google.maps.Animation.DROP}
        );
        return marker;
    }
}
//Install of serviceworker
if ('serviceWorker' in navigator){
    navigator.serviceWorker
        .register('sw.min.js')
        .then(function(registration){
            console.log('Serviceworker was sucessfully registered', registration);
            //IDB Erstellung
        })
        .catch(function(err){
            console.log('Could not register Serviceworker', err);
        })
}
