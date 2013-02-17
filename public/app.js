angular.module('app', ['ui','ui.bootstrap','http-auth-interceptor'])
  .config(['$routeProvider', '$locationProvider', function(route, location) {
    // handle routes
    route
      .when('/', { controller: 'MainCtrl', templateUrl: '/template/views/main.html'})
      .when('/app/posts/new', { controller: 'PostNewCtrl', templateUrl: '/template/views/post-form.html'})
      .when('/app/posts/:id/edit', { controller: 'PostEditCtrl', templateUrl: '/template/views/post-form.html'})
      .when('/app/posts/:id', { controller: 'PostCtrl', templateUrl: '/template/views/post.html'})
      ;
    // turn on html5 Push State
    location.html5Mode(true);
  }])
  .run(['$rootScope', 'authService', '$http', '$location', 
    function(scope, authService, $http, $location) {
      // check if logged in
      $http.get('/api/ping')
        .success(function() {
          scope.loggedIn = true;
        })
        ;

      // show login dialog
      scope.showLoginDlg = function() {
        scope.$broadcast('event:auth-loginRequired');
      }
      // logout
      scope.logout = function() {
        $http.post('/api/logout').success(function(data) {
          scope.loggedIn = false;
          $location.path('/');
        })
      }
      // initialize alerts
      scope.alerts = [];

      // add alert msg
      scope.addAlert = function(alert) {
        scope.alerts.push(alert);
        setTimeout(function() {
          scope.$apply(function(){ scope.closeAlert(0);
          })
        }, 2000);
      };

      // remove alert msg
      scope.closeAlert = function(index) {
        scope.alerts.splice(index, 1);
      };
  }])
  .controller('LoginCtrl',['$scope', '$location', '$http', 'authService', '$rootScope',
    function($scope, $location, $http, authService, $rootScope) {
      $scope.user = {};
      // handle listen to login required event
      $scope.$on('event:auth-loginRequired', function() {
        $scope.showLogin = true;
      });
      // handle listen to login confirmed event
      $scope.$on('event:auth-loginConfirmed', function() {
        $scope.user = {};
        $scope.showLogin = false;
        $scope.loginError = false;
        $rootScope.loggedIn = true;
      });
      // login to server
      $scope.login = function(user) {
        $http.post('/api/sessions', user)
          .success(function(data) {
            // show alert login success
            $scope.addAlert({type: 'success', msg: 'Login Successful!'})
            authService.loginConfirmed();
          })
          .error(function(err) {
            // show error
            $scope.loginError = true;
            //$scope.addAlert({type: 'error', msg: 'Access Denied!'})
          })
      }
      $scope.closeLogin = function() {
        $scope.user = {};
        $location.path('/');
        $scope.showLogin = false;
      }
  }])
  .controller('MainCtrl',['$scope', '$http', function($scope, $http){
    $http.get('/api/posts')
      .success(function(posts) {
        $scope.posts = posts;
      })
  }])
  .controller('PostCtrl', ['$scope', '$http', '$routeParams', 
    function($scope, $http, $routeParams) {
      var id = $routeParams.id  .split('-')[0];
      $http.get('/api/posts/' + id)
        .success(function(post) {
          $scope.post = post;
        })    
  }])
  .controller('PostNewCtrl',['$scope', '$http', '$location', 
    function($scope, $http, $location) {
      $http.get('/api/posts/new');
      $scope.save = function(post) {
        $http.post('/api/posts', post)
          .success(function (data) {
            $scope.addAlert({type: 'success', msg: 'Article has been posted successfully!'})
            $location.path('/');
          })
          .error(function() {
            $scope.addAlert({type: 'error', msg: 'Could not save article!'})
          })
      }
  }])
  .controller('PostEditCtrl', ['$scope', '$http', '$location', '$routeParams',
    function($scope, $http, $location, $routeParams) {
      $http.get('/api/posts/' + $routeParams.id + '/edit')
        .success(function(data) {
          $scope.post = data;
        })
      $scope.save = function(post) {
        $http.put('/api/posts/' + $routeParams.id, post)
          .success(function(data) {
            $scope.addAlert({type: 'success', msg: 'Article has been updated successfully!'})
            $location.path('/');
          })
          .error(function() {
            $scope.addAlert({type: 'error', msg: 'Could not update article!'})
          })
      }
      $scope.destroy = function(id) {
        $http.delete('/api/posts/' + id)
          .success(function(data) {
            $scope.addAlert({type: 'success', msg: 'Article has been deleted successfully!'})
            $location.path('/');
          })
          .error(function() {
            $scope.addAlert({type: 'error', msg: 'Could not delete article!'})
          })
      }
    }
  ])