'use strict';
angular.module("firebase.transactionManager", [])
	.service('FirebaseTransactionManager', FirebaseTransactionManager);

function FirebaseTransactionManager($firebaseObject) {
	/**
	 * start to observe a firebase Ref
	 *
	 * @param {Firebase}  firebaseRef
	 */
	function recordChanges(firebaseRef, options) {
		var self = {};

		//expose public methods
		self.snapshot = snapshot;
		self.canRollback = canRollback;
		self.rollback = rollback;
		self.canRestorePrevious = canRestorePrevious;
		self.restorePrevious = restorePrevious;
		self.hasSnapshot = hasSnapshot;
		self.clear = clear;

		//configure snapshot object and options
		var defaults = {
			remote: true
		};

		options = angular.extend(options, defaults);
		var object = $firebaseObject(firebaseRef);

		//TODO: implement optional snapshot path configuration
		var snapshotRef = 'snapshot';

		if (!options.remote) {
			snapshotRef = '$' + snapshotRef;
		}

		snapshotRef = object[snapshotRef];
		/**
		 * Perform a rollback
		 *
		 * @param {Object}  object
		 */
		function doRollback() {
			var lastSnapshot = snapshotRef[snapshotRef.length - 1];

			angular.forEach(object, function (val, key) {
				if (key != "snapshot") {
					object[key] = lastSnapshot[key];
				}
			});
		}

		/**
		 * Take a snapshot of an object
		 * @param {Object}  object
		 */
		function snapshot() {
			var tmp;

			if (!hasSnapshot()) { // has no snapshots yet
				snapshotRef = [angular.copy(object)];
			} else if (isChanged()) { // has snapshots and is changed since last version
				tmp = angular.copy(object);
				delete tmp.snapshot;
				snapshotRef.push(tmp);
			}
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
		 * @param object
		 * @returns {boolean}
		 */
		function canRestorePrevious() {
			return hasSnapshot() && snapshotRef.length > 1;
		}

		/**
		 * Restore previous snapshot
		 * Resets object to state before last snapshot
		 *
		 * @param {Object}  object
		 */
		function restorePrevious() {
			if (hasSnapshot()) {
				snapshotRef.pop();
				doRollback();
			}
		}

		/**
		 * Remove all snapshots
		 *
		 * @param {Object}  object
		 */
		function clear() {
			if (hasSnapshot()) {
				snapshotRef = [];
			}
		}

		/**
		 * Check if passed object has a snapshot
		 *
		 * @param {Object} object
		 * @returns {boolean}
		 */
		function hasSnapshot() {
			return snapshotRef !== undefined && snapshotRef.length !== 0;
		}

		/**
		 * Can perform a rollback,
		 * returns true in case has a snapshot and actual state is different from last snapshot
		 * @param object
		 * @returns {boolean}
		 */
		function canRollback() {
			return hasSnapshot() && isChanged();
		}

		/**
		 * Check if object was changed since last snapshot
		 *
		 * @param {object}  object
		 * @returns {boolean}
		 */

		function isChanged() {
			var changed = false;

			angular.forEach(object, function (val, key) {
				if (key != "snapshot" && object[key] != snapshotRef[snapshotRef.length - 1][key]) {
					changed = true;
				}
			});

			return changed;
		}

		return self;
	}


}
