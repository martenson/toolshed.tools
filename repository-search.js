$( document ).ready(function() {

    var Hit = Backbone.Model.extend({
        url : "/api/search/"
    });
    var Hits = Backbone.Collection.extend({
        url : "/api/search/",
        model: Hit
    });
    var ResultsContainer = Backbone.Model.extend({
        defaults : {
            container_hits : new Hits(),
            urlRoot : "/api/search/"
        }
    });

    var HitView = Backbone.View.extend({
        events:{
            'click .btn-install' : 'installRepository',
            'click .btn-matched' : 'showMatchedTerms'
        },

        defaults: {},

        initialize: function( options ){
            this.options = _.defaults( this.options || {}, this.defaults, options );
            this.model = options.hit;
            this.render( this.model );
        },

        render: function( model ){
            var template = this.templateHit();
            var repository = model.get( 'repository' );
            var sharable_url = this.options.shed.url + '/view/' + repository.repo_owner_username + '/' + repository.name;
            repository.url = sharable_url;
            this.setElement( template( { 
                repository: repository, 
                matched_terms: JSON.stringify( model.get( 'matched_terms' ) ),
                score: Math.ceil(model.get( 'score' ) * 100)/100 } ) );
            this.$el.show();
            return this;
        },

        installRepository: function(){
            alert( '“Use the Force, Luke.”' );
        },

        templateHit: function(){
            return _.template( [
            '<div class="hit-box" ">',
            '<div class="row primary-row" data-toggle="collapse" data-target=".<%- repository.id %>">',
            '   <div class="col-md-9">',
            '       <div>',
            '           <span class="repo-name"><%- repository.name %></span>',
            '           <span class="repo-owner">by <%- repository.repo_owner_username %></span>',
            '       </div>',
            '       <div>',
            '           <span class="repo-desc"><i><%- repository.description %></i></span>',
            '       </div>',
            '   </div>',
            '   <div class="col-md-3">',
            '   <% if (repository.approved === "yes") { %>',
            '   <div title="This is a Reviewed Tool of High Quality">',
            '       <span class="fa fa-certificate fa-lg"></span>&nbsp; Certified',
            '   </div>',
            '   <% } %>',
            '   <div title="Total Number of Installations">',
            '       <span  class="fa fa-download fa-lg"></span>&nbsp; <%- repository.times_downloaded %>',
            '   </div>',
            '   <div title="Tool Updated on <%- repository.full_last_updated %>">',
            '       <span class="fa fa-clock-o fa-lg"></span>&nbsp; <%- repository.last_updated %>',
            '   </div>',
            '   </div>',
            '</div>',
            '<div class="sub-row collapse row <%- repository.id %>">',
            '   <div class="col-md-10 col-md-offset-1">',
            '       <div>',
            '           <%- repository.long_description %>',
            '       </div>',
            '   </div>',
            '</div>',
            '<div class="sub-row collapse row <%- repository.id %>">',
            '   <div class="col-md-10 col-md-offset-1">',
                    '<a href="<%- repository.url %>" target="_blank"><button type="button" class="btn btn-primary"><span class="fa fa-search-plus fa-lg"></span> Details</button></a>',
                    '<a title="Visit Homepage" href="<%- repository.homepage_url %>" target="_blank"><button type="button" class="btn btn-primary"><span class="fa fa-home fa-lg"></span> Homepage</button></a>',
                    '<a href="<%- repository.remote_repository_url %>" target="_blank"><button type="button" class="btn btn-primary"><span class="fa fa-cogs fa-lg"></span> Development</button></a>',
                    // '<div class="btn-group">',
                    //   '<button type="button" class="btn btn-success dropdown-toggle" data-toggle="dropdown" aria-expanded="false">',
                    //     'Available on <span class="caret"></span>',
                    //   '</button>',
                    //   '<ul class="dropdown-menu" role="menu">',
                    //     '<li><a href="#">Main Galaxy</a></li>',
                    //     '<li><a href="#">Andromeda Galaxy</a></li>',
                    //     '<li><a href="#">Biomina</a></li>',
                    //     '<li class="divider"></li>',
                    //     '<li><a href="#">Test Galaxy</a></li>',
                    //   '</ul>',
                    // '</div>',
                    // '<a tabindex="0" class="btn btn-info" role="button" data-toggle="popover" data-trigger="focus" title="Matched Terms" data-content="score: <%- score %>    <%- matched_terms %>">Show matched terms</a>',
            '   </div>',
            '</div>',
            '<div class="sub-row collapse row <%- repository.id %>">',
            '   <div class="col-md-10 col-md-offset-1">',
                '   <p class="info">search score: <%- score %></p>',
                '</div>',
            '</div>',
            '</div>'
            ].join( '' ) );
        }
    });

    var ResultsView = Backbone.View.extend({
        el: '.results',
        defaults: {
            shed: {
                name: "Test Tool Shed",
                url: "https://testtoolshed.g2.bx.psu.edu"
            }
        },

        initialize: function( options ){
            this.options = _.defaults( this.options || {}, this.defaults, options );
            this.collection = new Hits();
            this.listenTo( this.collection, 'add', this.renderOne );
                // this.listenTo( this.collection, 'remove', this.removeOne );
                // start to listen if someone modifies the collection
            this.container = new ResultsContainer();
        },

        /**
         * Fetch results from all available Tool Sheds.
         * @param  {[type]} options [description]
         * @return {[type]}         [description]
         */
        fetchAll: function( options ){
            this.options = _.extend( this.options, options );
            this.collection.reset();
            this.fetchResults();
        },

        fetchResults: function( options ){
            this.options = _.extend( this.options, options );
            var that = this;
            this.container.url = this.options.shed.url + this.container.get( 'urlRoot' );
            this.container.fetch({
                 data : {
                    jsonp : true,
                    search_term : that.options.query
                },
                dataType: 'jsonp',
                success: function( response, results_container ){
                    if ( results_container.total_results > 0 ){
                        console.log( 'total results: ' + results_container.total_results + ' from: ' + results_container.hostname );
                        that.addAll();
                    } else{
                        console.log( 'fetched 0' );
                    }
                },
                error: function( parsedResponse,statusText,jqXhr ){
                    console.log( 'There was an error while fetching results.' );
                },
                timeout : 5000
            });
        },

        addAll: function( container_name ){
            var container = this.container;
            var hostname = container.get( 'hostname' );
            if ( container.get( 'hits' ).length > 0 ){
                for (var i = 0; i < container.get( 'hits' ).length; i++) {
                    var hit = container.get( 'hits' )[ i ]
                    hit.hostname = hostname;
                    this.collection.add( hit );
                }
            }
        },

        renderOne: function( hit ){
            var hitView = new HitView( { hit: hit, shed: this.options.shed } );
            this.$el.find('.hits').append( hitView.el );
            this.$el.find('[data-toggle="popover"]').popover();
        },

        removeOne: function( model ){

        },

        templateResultsHeader: function(){
            tmpl_array = [];

            tmpl_array.push('');
            tmpl_array.push('');

            return _.template( tmpl_array.join( '' ) );
        }

        });

$(function() {
    var resultListView = new ResultsView();
    var timer;
    $( "#search_input" ).keyup( function( e ) {
        $( '.hits' ).empty();
        clearTimeout(timer);
        var ms = 200; // milliseconds
        var val = this.value;
        if ( val.length > 2 ){
            timer = setTimeout( function() {
                $( '.hits' ).empty();
                resultListView.fetchAll( { query: val } );
            }, ms );
        }
  });
    $( "#search_input" ).keydown( function( e ) {
        if( event.keyCode == 13 ) {
            event.preventDefault();
            return false;
        }
  });

});



});
