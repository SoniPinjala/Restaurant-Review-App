/**
 * Common database helper functions.
 */
class DBHelper {

	/**
	 * Database URL.
	 * Change this to restaurants.json file location on your server.
	 */
	static get DATABASE_URL() {
		const port = 1337 // Change this to your server port
		return `http://localhost:${port}` // or mock data: `http://localhost:8000/data/restaurants.json`;
	}

	/**
	 * IndexedDB Promised
	 */
	static get dbPromise() {
		if (!navigator.serviceWorker) {
			return Promise.resolve();
		} else {
			return idb.open('restaurants', 1, function (upgradeDb) {
				upgradeDb.createObjectStore('all-restaurants', { keyPath: 'id' });
				upgradeDb.createObjectStore('all-reviews', { keyPath: 'id' });
				upgradeDb.createObjectStore('offline-reviews', { keyPath: 'updatedAt' });
			});
		}
	}

	/**
	 * Fetch all restaurants.
	 */
	static fetchRestaurants(callback) {
		DBHelper.dbPromise.then(db => {
			if (!db) {
				// Fetch from network
				let xhr = new XMLHttpRequest();
				xhr.open('GET', `${DBHelper.DATABASE_URL}/restaurants`);
				xhr.onload = () => {
					if (xhr.status === 200) { // Got a success response from server!        
						const restaurants = JSON.parse(xhr.responseText);

						this.dbPromise.then(db => {
							if (!db) return;
							// Put fetched restaurants into IDB
							const tx = db.transaction('all-restaurants', 'readwrite');
							const store = tx.objectStore('all-restaurants');
							restaurants.forEach(restaurant => {
								store.put(restaurant);
							})
						});

						callback(null, restaurants);
					} else { // Oops!. Got an error from server.
						const error = (`Request failed. Returned status of ${xhr.status}`);
						callback(error, null);
					}
				};
				xhr.send();
			} else {
				const tx = db.transaction('all-restaurants');
				const store = tx.objectStore('all-restaurants');
				store.getAll().then(results => {
					if (results.length === 0) {
						// Fetch from network
						let xhr = new XMLHttpRequest();
						xhr.open('GET', `${DBHelper.DATABASE_URL}/restaurants`);
						xhr.onload = () => {
							if (xhr.status === 200) { // Got a success response from server!        
								const restaurants = JSON.parse(xhr.responseText);

								this.dbPromise.then(db => {
									if (!db) return;
									// Put fetched restaurants into IDB
									const tx = db.transaction('all-restaurants', 'readwrite');
									const store = tx.objectStore('all-restaurants');
									restaurants.forEach(restaurant => {
										store.put(restaurant);
									})
								});

								callback(null, restaurants);
							} else { // Oops!. Got an error from server.
								const error = (`Request failed. Returned status of ${xhr.status}`);
								callback(error, null);
							}
						};
						xhr.send();
					} else {
						callback(null, results);
					}
				});
			}
		});
	}

	/**
	 * Fetch a restaurant by its ID.
	 */
	static fetchRestaurantById(id, callback) {
		// fetch all restaurants with proper error handling.
		DBHelper.fetchRestaurants((error, restaurants) => {
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
		DBHelper.fetchRestaurants((error, restaurants) => {
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
		DBHelper.fetchRestaurants((error, restaurants) => {
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
		DBHelper.fetchRestaurants((error, restaurants) => {
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
		DBHelper.fetchRestaurants((error, restaurants) => {
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
		DBHelper.fetchRestaurants((error, restaurants) => {
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
	 * Fetch all reviews for a restaurant
	 */
	static fetchRestaurantReviews(restaurant, callback) {
		DBHelper.dbPromise.then(db => {
			if (true) {
				// Fetch from network
				fetch(`${DBHelper.DATABASE_URL}/reviews/?restaurant_id=${restaurant.id}`)
					.then(response => {
						return response.json();
					})
					.then(reviews => {
						this.dbPromise.then(db => {
							if (!db) return;
							// Put fetched reviews into IDB
							const tx = db.transaction('all-reviews', 'readwrite');
							const store = tx.objectStore('all-reviews');
							reviews.forEach(review => {
								store.put(review);
							})
						});
						callback(null, reviews);
					})
					.catch(error => {
						callback(error, null);
					})
			} else {
				const tx = db.transaction('all-reviews');
				const store = tx.objectStore('all-reviews');
				store.getAll().then(results => {
					if (results.length === 0) {
						fetch(`${DBHelper.DATABASE_URL}/reviews/?restaurant_id=${restaurant.id}`)
							.then(response => {
								return response.json();
							})
							.then(reviews => {
								this.dbPromise.then(db => {
									if (!db) return;
									// Put fetched reviews into IDB
									const tx = db.transaction('all-reviews', 'readwrite');
									const store = tx.objectStore('all-reviews');
									reviews.forEach(review => {
										store.put(review);
									})
								});
								callback(null, reviews);
							})
							.catch(error => {
								callback(error, null);
							})
					} else {
						callback(null, results);
					}

				})

			}
		})
	}

	/**
	 * Restaurant page URL.
	 */
	static urlForRestaurant(restaurant) {

		return (`./restaurant.html?id=${restaurant.id}`);
	}

	/**
	 * Restaurant image URL.
	 */
	static imageUrlForRestaurant(restaurant) {
		if (restaurant.photograph) {
			return (`/img/${restaurant.photograph}.webp`);
		} else {
			return (`/img/default.webp`);
		}
	}

	/**
	 * Map marker for a restaurant.
	 */
	static mapMarkerForRestaurant(restaurant, map) {
		const marker = new google.maps.Marker({
			position: restaurant.latlng,
			title: restaurant.name,
			url: DBHelper.urlForRestaurant(restaurant),
			map: map,
			animation: google.maps.Animation.DROP
		}
		);
		return marker;
	}

	static submitReview(data) {
		console.log(data);
		
		return fetch(`${DBHelper.DATABASE_URL}/reviews/`, {
			body: JSON.stringify(data), 
			cache: 'no-cache', // *default, no-cache, reload, force-cache, only-if-cached
			credentials: 'same-origin', // include, same-origin, *omit
			headers: {
				'content-type': 'application/json'
			},
			method: 'POST',
			mode: 'cors', // no-cors, cors, *same-origin
			redirect: 'follow', // *manual, follow, error
			referrer: 'no-referrer', // *client, no-referrer
		})
		.then(response => {
			response.json()
				.then(data => {
					this.dbPromise.then(db => {
						if (!db) return;
						// Put fetched reviews into IDB
						const tx = db.transaction('all-reviews', 'readwrite');
						const store = tx.objectStore('all-reviews');
						store.put(data);
					});
					return data;
				})
		})
		.catch(error => {
			/**
			 * Network offline.
			 * Add a unique updatedAt property to the review
			 * and store it in the IDB.
			 */
			data['updatedAt'] = new Date().getTime();
			console.log(data);
			
			this.dbPromise.then(db => {
				if (!db) return;
				// Put fetched reviews into IDB
				const tx = db.transaction('offline-reviews', 'readwrite');
				const store = tx.objectStore('offline-reviews');
				store.put(data);
				console.log('Review stored offline in IDB');
			});
			return;
		});
	}
}