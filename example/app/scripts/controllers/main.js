'use strict';

app.controller('MainCtrl', function ($scope, FirebaseTransactionManager, $firebaseObject) {
	var ref = new Firebase('https://webchart-poc.firebaseio.com/');
	$scope.foo = $firebaseObject(ref.child('users')
		.child('1'));
	$scope.snaps = $firebaseObject(ref.child('snapshots'));

	$scope.foo.$loaded()
		.then(startRecordTracking);

	function startRecordTracking() {
		console.log($scope.foo);
		$scope.myHistory = FirebaseTransactionManager.recordChanges($scope.foo, $scope.snaps.$ref());
	}

});
