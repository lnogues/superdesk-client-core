/*
 * Delete sessions of a user
 */
SessionsDeleteCommand.$inject = ['api', 'data', '$q', 'notify', 'gettext', '$rootScope'];
export function SessionsDeleteCommand(api, data, $q, notify, gettext, $rootScope) {
    var user = data.item;
    api.remove(user, {}, 'clear_sessions')
        .then(function () {
            user.session_preferences = {};
            notify.success(gettext('Sessions cleared'));
        }, function (response) {
            notify.error(gettext('Error. Sessions could not be cleared.'));
        });
}
