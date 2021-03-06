import notifySaveError from '../helpers';

TemplatesDirective.$inject = ['gettext', 'notify', 'api', 'templates', 'modal', 'desks', 'weekdays',
                              'content', '$filter', 'lodash'];
export function TemplatesDirective(gettext, notify, api, templates, modal, desks, weekdays, content, $filter, _) {
    return {
        templateUrl: 'scripts/superdesk-templates/views/templates.html',
        link: function ($scope) {
            $scope.weekdays = weekdays;
            $scope.content_templates = null;
            $scope.origTemplate = null;
            $scope.template = null;
            $scope.desks = null;
            $scope.template_desk = null;
            $scope.error = {};

            function fetchTemplates() {
                templates.fetchAllTemplates(1, 200).then(
                    function(result) {
                        result._items = $filter('sortByName')(result._items, 'template_name');
                        $scope.content_templates = result;
                    }
                );
            }

            desks.initialize().then(function() {
                $scope.desks = desks.desks;
                selectDesk(null);
            });

            content.getTypes().then(function() {
                $scope.content_types = content.types;
            });

            /*
             * Checks if the user is Admin or Not.
             */
            $scope.isAdmin = function() {
                return templates.isAdmin();
            };

            /*
             * Returns true if desks selection should be displayed
             */
            $scope.showDesks = function() {
                return $scope.template != null &&
                    $scope.template.template_type != null &&
                    $scope.template.template_type !== 'kill' &&
                    $scope.template.is_public;
            };

            /*
             * Returns true if stage selection should be displayed
             */
            $scope.showStages = function() {
                return $scope.showScheduling() &&
                    $scope.stages != null && $scope.stages.length > 0;
            };

            /*
             * Returns true if scheduling should be displayed
             */
            $scope.showScheduling = function() {
                return $scope.template != null &&
                    $scope.template.template_type !== 'kill' &&
                    $scope.template.is_public;
            };

            /*
             * Called on desk toggle on multiple desk selection
             */
            $scope.toggleDesk = function(desk) {
                desk.selected = !desk.selected;
                $scope.onDeskToggle(desk);
            };

            /*
             * Called on desk toggle on multiple desk selection
             */
            $scope.onDeskToggle = function(desk) {
                if (desk.selected && !$scope.template.template_desks) {
                    $scope.template.template_desks = [desk._id];
                    return;
                }
                var deskIndex = _.findIndex($scope.template.template_desks, function(val) { return val === desk._id; });
                if (desk.selected && deskIndex === -1) {
                    $scope.template.template_desks.push(desk._id);
                }
                if (!desk.selected && deskIndex !== -1) {
                    $scope.template.template_desks.splice(deskIndex, 1);
                }
            };

            /*
             * Set desk selected property for the given desk
             */
            function selectDesk(deskId) {
                $scope.template_desk = deskId;
                _.forEach($scope.desks._items, function(desk) {
                    desk.selected = desk._id === deskId;
                });
            }

            /*
             * Set desk selected property for the given desks
             */
            function selectDesks(desksIds) {
                if (desksIds instanceof Array) {
                    _.forEach($scope.desks._items, function(desk) {
                        var deskIndex = _.findIndex(desksIds, function(deskId) { return deskId === desk._id; });
                        desk.selected = deskIndex !== -1;
                    });
                }
            }

            /*
             * Sets the template template_desks list to null if deskId is null/empty or to a list with one element.
             */
            $scope.setTemplateDesks = function(deskId) {
                if (deskId == null || deskId === '') {
                    $scope.template.template_desks = null;
                    selectDesk(null);
                } else {
                    $scope.template.template_desks = [deskId];
                    selectDesk(deskId);
                }
            };

            /*
             * Truncates the template template_desks list to the first element.
             */
            $scope.resetDesks = function() {
                if ($scope.template.template_desks != null &&
                        $scope.template.template_type !== 'create' &&
                        $scope.template.template_desks.length > 0) {
                    $scope.template.template_desks.splice(1, $scope.template.template_desks.length - 1);
                    selectDesk($scope.template.template_desks[0]);
                }
                if ($scope.template.template_type === 'create') {
                    $scope.template_desk = null;
                }
            };

            $scope.templatesFilter = function(template_type) {
                if ($scope.template._id && $scope.template.template_type === 'kill') {
                    return template_type._id === 'kill';
                } else {
                    return template_type._id !== 'kill';
                }
            };

            /*
             * Returns desks names
             */
            $scope.getTemplateDesks = function (template) {
                var templateDesks = [];
                _.forEach(template.template_desks, function(deskId) {
                    var desk = _.find($scope.desks._items , {_id: deskId});
                    if (desk) {
                        templateDesks.splice(-1, 0, desk.name);
                    }
                });
                return templateDesks.join(', ');
            };

            /*
             * Returns the schedule desk stage name
             */
            $scope.getScheduleDesk = function (template) {
                if (template != null) {
                    return _.find($scope.desks._items , {_id: template.schedule_desk}).name;
                }
                return null;
            };

            /*
             * Returns the schedule desk stage name
             */
            $scope.getScheduleStage = function (template) {
                if (template != null) {
                    return _.find(desks.stages._items , {_id: template.schedule_stage}).name;
                }
                return null;
            };

            $scope.types = templates.types;

            function validate(orig, item) {
                $scope.error = {};
                if (!item.template_name) {
                    $scope.error.template_name = true;
                }
                if (!item.template_type) {
                    $scope.error.template_type = true;
                }
                return !_.has($scope.error, 'template_name') && !_.has($scope.error, 'template_type');
            }

            $scope.save = function() {
                if (validate($scope.origTemplate, $scope.template)) {
                    templates.save($scope.origTemplate, $scope.template)
                    .then(
                        function() {
                            notify.success(gettext('Template saved.'));
                            $scope.cancel();
                        },
                        function(response) {
                            notifySaveError(response, notify);
                        }
                    ).then(fetchTemplates);
                }
            };

            $scope.edit = function(template) {
                $scope.origTemplate = template || {template_type: 'create', is_public: true};
                $scope.template = _.create($scope.origTemplate);
                $scope.template.schedule = $scope.origTemplate.schedule || {};
                $scope.template.data = $scope.origTemplate.data || {
                    headline: '',
                    abstract: '',
                    byline: '',
                    body_html: ''
                };
                $scope.template.template_desks = $scope.origTemplate.template_desks || [];
                $scope.stages = $scope.template.schedule_desk ? desks.deskStages[$scope.template.schedule_desk] : null;
                $scope.template.template_type = $scope.origTemplate.template_type;
                if (!templates.isAdmin()) {
                    // User with no admin privileges cannot create public templates.
                    $scope.template.is_public = false;
                } else {
                    $scope.template.is_public = $scope.template.is_public !== false;
                }

                $scope.item = $scope.template.data || {};
                $scope._editable = true;
                $scope.error = {};
                selectDesks($scope.template.template_desks);
            };

            $scope.$watch('item.profile', function(profile) {
                if (profile) {
                    content.getType(profile).then(setupContentType);
                } else {
                    setupContentType();
                }
            });

            function setupContentType(type) {
                $scope.schema = content.schema(type);
                $scope.editor = content.editor(type);
            }

            $scope.remove = function(template) {
                modal.confirm(gettext('Are you sure you want to delete the template?'))
                    .then(function() {
                        return api.remove(template);
                    })
                    .then(function(result) {
                        _.remove($scope.templates, template);
                    }, function(response) {
                        if (angular.isDefined(response.data._message)) {
                            notify.error(gettext('Error: ' + response.data._message));
                        } else {
                            notify.error(gettext('There was an error. Template cannot be deleted.'));
                        }
                    })
                    .then(fetchTemplates);
            };

            $scope.cancel = function() {
                $scope.origTemplate = null;
                $scope.template = null;
                $scope.vars = null;
                fetchTemplates();
            };

            $scope.updateStages = function(desk) {
                $scope.stages = desk ? desks.deskStages[desk] : null;
                $scope.template.schedule_stage = null;
            };

            $scope.validSchedule = function() {
                return $scope.template.schedule.is_active ?
                    $scope.template.schedule.day_of_week && $scope.template.schedule.create_at :
                    true;
            };

            $scope.filters = [
                {label: gettext('All'), value: 'All'},
                {label: gettext('Personal'), value: 'Personal'},
                {label: gettext('No Desk'), value: 'None'}
            ];

            // holds the index of the active filter.
            $scope.activeFilter = 0;

            // sets the active filter to another index.
            $scope.filterBy = function(idx) {
                $scope.activeFilter = idx;
            };

            // fetch all desks for the current user and add them to
            // the list of filters.
            desks.fetchDesks().then(function(desks) {
                $scope.filters = $scope.filters.concat(
                    desks._items.map(function(d) {
                        return {label: d.name, value: d._id};
                    })
                );
            });

            fetchTemplates();
        }
    };
}
