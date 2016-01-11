$( document ).ready(function() {

    var SearchRouter = Backbone.Router.extend({

      routes: {
        ""             : "search_repos",
        // "repos/:query" : "search_repos",
        "tools/:query" : "search_tools"
      }

    });

    var Hit = Backbone.Model.extend({
        url : "/api/repositories"
    });
    var Hits = Backbone.Collection.extend({
        url : "/api/repositories",
        model: Hit
    });
    var ResultsContainer = Backbone.Model.extend({
        defaults : {
            container_hits : new Hits(),
            urlRoot : "/api/repositories"
        }
    });

    var ToolHit = Backbone.Model.extend({
        url : "/api/tools"
    });
    var ToolHits = Backbone.Collection.extend({
        url : "/api/tools",
        model: ToolHit
    });
    var ToolContainer = Backbone.Model.extend({
        defaults : {
            container_hits : new ToolHits(),
            urlRoot : "/api/tools"
        }
    });

    var SearchView = Backbone.View.extend({
        el: '.searchbox',
        events:{
            'keyup #search_input' : 'search',
            'click .search-clear' : 'clearSearchInput'
        },

        // test: function(){
        //   alert('works!');
        // },

        search: function(e){
          var timer;
          $('.hits').empty();
          $('.no-results').hide();
          $('.search-loader').show();
          clearTimeout(timer);
          var ms = 200; // milliseconds
          var q = $('#search_input').val();
          ga( 'send', 'pageview', '/?q=' + q );
          var that = this;
          if ( q.length > 2 ){
              timer = setTimeout( function() {
                  $( '.hits' ).empty();
                  that.options.app.resultListView.fetchAll( { query: q } );
              }, ms );
          }
        },

        initialize: function( options ){
            this.options = _.defaults( this.options || {}, this.defaults, options );
            this.render();
        },

        render: function(){
            var template = this.templateSearch();
            this.$el.html(template());
            $('[data-toggle="tooltip"]').tooltip()
            return this;
        },

        clearSearchInput: function( event ){
            $('#search_input').val('');
        },

        templateSearch: function(){
            return _.template( [
            '<form>',
                '<div class="form-group">',
                    '<label class="sr-only" for="search_input">Search</label>',
                    '<input type="search" autocomplete="off" class="form-control" id="search_input" placeholder="Search Tool Shed">',
                    '<span href="#" class="search-clear fa fa-lg fa-times-circle" data-toggle="tooltip" data-placement="top" title="clear (esc)"></span>',
                '</div>',
            '</form>',
            '<div>',
                '<a href="" class="repositories-results-link">Repositories</a> | <a class="tools-results-link" href="">Tools</a> | Categories | Authors | Groups',
            '</div>'
            ].join( '' ) );
        }

    });

    var HitView = Backbone.View.extend({
        events:{
            'click .btn-install'  : 'installRepository',
            'click .btn-matched'  : 'showMatchedTerms'
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
            console.log(repository)
            this.setElement( template( {
                repository: repository,
                matched_terms: JSON.stringify( model.get( 'matched_terms' ) ),
                score: Math.ceil(model.get( 'score' ) * 100)/100 } ) );
            this.$el.show();
            $('[data-toggle="tooltip"]').tooltip()
            return this;
        },

        installRepository: function(){
            alert( '“Use the Force, Luke.”' );
        },

        templateHit: function(){
            return _.template( [
            '<div class="hit-box">',
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
                '   <div data-toggle="tooltip" data-placement="top" title="This is a Reviewed Tool of High Quality">',
                '       <span class="fa fa-certificate fa-lg"></span>&nbsp; Certified',
                '   </div>',
                '   <% } %>',
                '   <div data-toggle="tooltip" data-placement="top" title="Total number of clones">',
                '       <span  class="fa fa-download fa-lg"></span>&nbsp; <%- repository.times_downloaded %>',
                '   </div>',
                '   <div data-toggle="tooltip" data-placement="top" title="Updated <%- repository.full_last_updated %>">',
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
                // '</div>',
                // '<div class="sub-row collapse row <%- repository.id %>">',
                '   <div class="col-md-10 col-md-offset-1">',
                        '<a data-toggle="tooltip" data-placement="top" title="Visit Tool Shed" href="<%- repository.url %>" target="_blank"><button type="button" class="btn-hit btn btn-default"><span class="fa fa-link fa-lg"></span> </button></a>',
                        '<% if(repository.homepage_url !== null){ %>',
                        '<a data-toggle="tooltip" data-placement="top" title="Visit Homepage" href="<%- repository.homepage_url %>" target="_blank"><button type="button" class="btn-hit btn btn-default"><span class="fa fa-home fa-lg"></span> </button></a>',
                        '<% } %>',
                        '<% if(repository.remote_repository_url !== null){ %>',
                        '<a data-toggle="tooltip" data-placement="top" title="Visit Development Repository" href="<%- repository.remote_repository_url %>" target="_blank"><button type="button" class="btn-hit btn btn-default"><span class="fa fa-cogs fa-lg"></span> </button></a>',
                        '<% } %>',
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
                // '</div>',
                // '<div class="sub-row collapse row <%- repository.id %>">',
                    '<div class="col-md-10 col-md-offset-1">',
                        '<p class="info">search score: <%- score %></p>',
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
                name: "Main Tool Shed",
                url: "https://toolshed.g2.bx.psu.edu"
            }
        },

        initialize: function(options){
            this.options = _.defaults( this.options || {}, this.defaults, options );
            this.collection = new Hits();
            this.listenTo( this.collection, 'add', this.renderOne );
            // this.listenTo( this.collection, 'remove', this.removeOne );
            // start to listen if someone modifies the collection
            this.container = new ResultsContainer();
            this.tool_container = new ResultsContainer();
        },

        /**
         * Fetch results from all available Tool Sheds.
         * @param  {[type]} options [description]
         * @return {[type]}         [description]
         */
        fetchAll: function(options){
            this.options = _.extend( this.options, options );
            this.collection.reset();
            this.fetchRepoResults();
        },

        fetchRepoResults: function( options ){
            this.options = _.extend( this.options, options );
            var that = this;
            this.container.url = this.options.shed.url + this.container.get( 'urlRoot' );
            this.container.fetch({
                 data : {
                    jsonp : true,
                    q : that.options.query,
                    page_size: 50
                },
                dataType: 'jsonp',
                success: function( response, results_container ){
                    $('.search-loader').hide();
                    if ( results_container.total_results > 0 ){
                        $('.no-results').hide();
                        console.log( 'total results: ' + results_container.total_results + ' from: ' + results_container.hostname );
                        $('.repositories-results-link').text('Repositories(' + results_container.total_results + ')');
                        that.addAll();
                    } else{
                        console.log( 'fetched 0' );
                        $('.no-results').show();
                    }
                },
                error: function(parsedResponse, statusText, jqXhr){
                    console.log('There was an error while fetching results.');
                },
                timeout : 10000
            });
        },

        fetchToolResults: function( options ){
            this.options = _.extend( this.options, options );
            var that = this;
            this.tool_container.url = this.options.shed.url + this.container.get( 'urlRoot' );
            this.container.fetch({
                 data : {
                    jsonp : true,
                    q : that.options.query,
                    page_size: 50
                },
                dataType: 'jsonp',
                success: function( response, results_container ){
                    $('.search-loader').hide();
                    if ( results_container.total_results > 0 ){
                        $('.no-results').hide();
                        console.log( 'total results: ' + results_container.total_results + ' from: ' + results_container.hostname );
                        $('.repositories-results-link').text('Repositories(' + results_container.total_results + ')');
                        that.addAll();
                    } else{
                        console.log( 'fetched 0' );
                        $('.no-results').show();
                    }
                },
                error: function(parsedResponse, statusText, jqXhr){
                    console.log('There was an error while fetching results.');
                },
                timeout : 10000
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
        }

    });

var SearchApp = Backbone.View.extend({
  searchView: null,
  resultListView: null,

  initialize: function(){
    this.search_router = new SearchRouter();
    this.search_router.on( 'route:search_repos', function() {
      this.searchView = new SearchView({'app': this});
      this.resultListView = new ResultsView({'app': this});
    });

    $( "#search_input" ).keydown( function( e ) {
      if( event.keyCode == 13 ) {
        event.preventDefault();
        return false;
      }
    });

    Backbone.history.start({pushState: false});
  },
});

$(function() {
  window.searchApp = new SearchApp();
});

});
