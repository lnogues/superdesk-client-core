SearchHighlights.$inject = ['highlightsService'];
export function SearchHighlights(highlightsService) {
    return {
        scope: {highlight_id: '=highlight'},
        templateUrl: 'scripts/superdesk-highlights/views/search_highlights_dropdown_directive.html',
        link: function(scope) {
            scope.selectHighlight = function(highlight) {
                scope.highlight_id = null;
                if (highlight) {
                    scope.highlight_id = highlight._id;
                }
            };

            scope.hasHighlights = function() {
                return _.size(scope.highlights) > 0;
            };

            highlightsService.get().then(function(result) {
                scope.highlights = result._items;
            });
        }
    };
}
