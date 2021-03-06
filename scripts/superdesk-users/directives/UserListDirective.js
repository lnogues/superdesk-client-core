UserListDirective.$inject = ['keyboardManager', 'usersService', 'asset'];
export function UserListDirective(keyboardManager, usersService, asset) {
    return {
        templateUrl: asset.templateUrl('superdesk-users/views/user-list-item.html'),
        scope: {
            roles: '=',
            users: '=',
            selected: '=',
            done: '='
        },
        link: function(scope, elem, attrs) {

            scope.active = function(user) {
                return usersService.isActive(user);
            };

            scope.pending = function(user) {
                return usersService.isPending(user);
            };

            scope.select = function(user) {
                scope.selected = user;
                bindKeys();
            };

            scope.$watch('selected', function(selected) {
                if (selected == null) {
                    bindKeys();
                }
            });

            scope.isLoggedIn = function(user) {
                return usersService.isLoggedIn(user);
            };

            function bindKeys() {
                unbindKeys();
                keyboardManager.bind('down', moveDown);
                keyboardManager.bind('up', moveUp);
            }

            function unbindKeys() {
                keyboardManager.unbind('down');
                keyboardManager.unbind('up');
            }

            function moveDown() {
                var selectedIndex = getSelectedIndex();
                if (selectedIndex !== -1) {
                    scope.select(scope.users[_.min([scope.users.length - 1, selectedIndex + 1])]);
                }
            }

            function moveUp() {
                var selectedIndex = getSelectedIndex();
                if (selectedIndex !== -1) {
                    scope.select(scope.users[_.max([0, selectedIndex - 1])]);
                }
            }

            function getSelectedIndex() {
                return _.findIndex(scope.users, scope.selected);
            }
        }
    };
}
