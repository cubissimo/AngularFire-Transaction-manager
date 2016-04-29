'use strict';
angular.module("firebase.transactionManager", [])
	.service('FirebaseTransactionManager', FirebaseTransactionManager);

function FirebaseTransactionManager($firebaseObject) {
	this.recordChanges = recordChanges;
	/**
	 * start to observe a firebase Ref
	 *
	 * @param {$firebaseObject}  firebaseObject
	 */
	function recordChanges(dataObject, snapshotRef, options) {
		var self = {};

		//expose public methods
		self.snapshot = snapshot;
		self.canRollback = canRollback;
		self.rollback = rollback;
		self.canRestorePrevious = canRestorePrevious;
		self.restorePrevious = restorePrevious;
		self.hasSnapshot = hasSnapshot;
		self.saveAndSnap = saveAndSnap;
		self.clear = clear;

		//configure snapshot object and options
		var defaults = {
			remote: true
		};
		var relativeRef = dataObject.$ref()
			.toString()
			.replace(dataObject.$ref()
				.root()
				.toString(), '');
		options = angular.extend(defaults, options);
		var object = dataObject;
		var snap = $firebaseObject(snapshotRef.child(unescape(relativeRef)));

		//TODO: implement optional snapshot path configuration
		// var snapshotRef = 'snapshot';
		//
		// if (!options.remote) {
		// 	snapshotRef = '$' + snapshotRef;
		// }


		/**
		 * Perform a save on firebase
		 *
		 */
		function saveSnap() {
			if (options.remote) {
				return snap.$save();
			}
		}

		function save() {
			return object.$save();
		}

		function saveAndSnap() {
			snapshot();
			save();
		}

		/**
		 * Perform a rollback
		 *
		 */
		function doRollback() {
			var lastSnapshot = snap.history[snap.history.length - 1];

			angular.forEach(object, function (val, key) {
				if (key != "snapshot") {
					object[key] = lastSnapshot[key];
				}
			});

			save();
			saveSnap();
		}

		/**
		 * Take a snapshot of an object
		 */
		function snapshot() {
			var tmp;

			if (!hasSnapshot()) { // has no snapshots yet
				snap.history = [angular.copy(object)];
			} else if (isChanged()) { // has snapshots and is changed since last version
				tmp = angular.copy(object);
				snap.history.push(tmp);
			}

			saveSnap();
		}

		/**
		 * Perform a rollback
		 * @param object
		 */
		function rollback() {
			if (hasSnapshot()) {
				doRollback();
			}
		}

		/**
		 * Check if can restore previous
		 * @returns {boolean}
		 */
		function canRestorePrevious() {
			return hasSnapshot() && snap.history.length > 1;
		}

		/**
		 * Restore previous snapshot
		 * Resets object to state before last snapshot
		 *
		 */
		function restorePrevious() {
			if (hasSnapshot()) {
				snap.history.pop();
				doRollback();
			}
		}

		/**
		 * Remove all snapshots
		 *
		 */
		function clear() {
			if (hasSnapshot()) {
				snap.history = [];
			}
			saveSnap();
		}

		/**
		 * Check if passed object has a snapshot
		 *
		 * @returns {boolean}
		 */
		function hasSnapshot() {
			return snap && snap.history && snap.history.length;
		}

		/**
		 * Can perform a rollback,
		 * returns true in case has a snapshot and actual state is different from last snapshot
		 * @returns {boolean}
		 */
		function canRollback() {
			return hasSnapshot() && isChanged();
		}

		/**
		 * Check if object was changed since last snapshot
		 *
		 * @returns {boolean}
		 */

		function isChanged() {
			var changed = false;

			angular.forEach(object, function (val, key) {
				if (key != "snapshot" && object[key] != snap.history[snap.history.length - 1][key]) {
					changed = true;
				}
			});

			return changed;
		}

		return self;
	}

	return this;
}
