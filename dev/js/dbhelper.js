
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
     * open Database.
     * Method to open the databaseconnection
     * */
  static openDatabase() {
        return idb.open('restaurants' , 1  , function(upgradeDb) {
            upgradeDb.createObjectStore('restaurants' ,{keyPath: 'id'});
        });
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
