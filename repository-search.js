$( document ).ready(function() {

    var SearchRouter = Backbone.Router.extend({

      routes: {
        ""           : "home",
        "repos?q="   : "search_repos",
        "repos?q=:q" : "search_repos",
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
            'keyup #search_input'    : 'search',
            'keydown #search_input' : 'detectSpecialKeys',
            'click .search-clear'    : 'clearSearch'
        },

        defaults:{
          searchtype: 'repos',
          query: ''
        },

        initialize: function(options){
            this.options = _.defaults( this.options || {}, options, this.defaults );
            this.render();
            if (this.options.query !== ''){
              $('#search_input').val(this.options.query);
              this.search(options);
            }
        },

        search: function(options){
          this.options = _.extend(this.options, options);
          $('.repo-hits').empty();
          $('.no-results').hide();
          $('.too-short').hide();

          if (this.timer) {
            clearTimeout(this.timer);
          }
          var that = this;
          this.timer = setTimeout(function () {
            if (that.options.query === ''){
              console.log('query is empty');
              that.options.query = $('#search_input').val().toLowerCase().trim();
            }
            console.log('query: '+that.options.query);
            if ( that.options.query.length === 0 ){
              Backbone.history.navigate('');
              return false;
            } else if ( that.options.query.length < 3 ){
              $('.too-short').show();
              that.options.query = '';
            } else if ( that.options.query.length > 2 ){
              $('.search-loader').show();
              that.options.app.resultListView.fetchAll({'query': that.options.query, 'searchtype': that.options.searchtype});
              // log the search to analytics if present
              if ( typeof ga !== 'undefined' ) {
                  ga('send', 'pageview', '/?q=' + that.options.query);
              }
              console.log('changin URL');
              Backbone.history.navigate(that.options.searchtype + '?q=' + that.options.query, {trigger:false});
              that.options.query = '';
            }
          }, 400 );
        },

        detectSpecialKeys: function(event){
          if( event.which == 13 ) {
            event.preventDefault();
            this.search(event);
          } else if (event.which === 27){
            event.preventDefault();
            this.clearSearch();
            return false;
          }
        },

        render: function(){
            var template = this.templateSearch();
            this.$el.html(template());
            $('[data-toggle="tooltip"]').tooltip()
            return this;
        },

        clearSearch: function(){
          this.options.query = '';
          $('#search_input').val('');
          $('.repositories-results-link').text('Repositories');
        },

        templateSearch: function(){
            return _.template( [
            '<form>',
                '<div class="form-group">',
                    '<label class="sr-only" for="search_input">Search</label>',
                    '<input name="query" type="search" autocomplete="off" class="form-control" id="search_input" placeholder="Search Tool Shed">',
                    '<span href="#" class="search-clear fa fa-lg fa-times-circle" data-toggle="tooltip" data-placement="top" title="clear (esc)"></span>',
                '</div>',
            '</form>',
            '<div>',
                '<a href="#repos" class="repositories-results-link">Repositories</a> | <a href="#tools" class="tools-results-link">Tools</a> | Categories | Authors | Groups',
            '</div>'
            ].join( '' ) );
        }

    });

    var RepoHitView = Backbone.View.extend({
        events:{
            'click .btn-matched'  : 'showMatchedTerms'
        },

        defaults: {},

        initialize: function( options ){
            this.options = _.defaults(this.options || {}, this.defaults, options);
            this.model = options.hit;
            this.render(this.model);
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
            $('[data-toggle="tooltip"]').tooltip()
            return this;
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
          searchtype: 'repos',
            shed: {
                name: "Main Tool Shed",
                url: "https://toolshed.g2.bx.psu.edu"
            }
        },

        initialize: function(options){
            this.options = _.defaults( this.options || {}, this.defaults, options );
            this.repo_collection = new Hits();
            this.tool_collection = new ToolHits();
            this.listenTo( this.repo_collection, 'add', this.renderOneRepo );
            this.listenTo( this.tool_collection, 'add', this.renderOneTool );
            // this.listenTo( this.repo_collection, 'remove', this.removeOne );
            // start to listen if someone modifies the repo_collection
            this.container = new ResultsContainer();
            this.tool_container = new ResultsContainer();
        },

        fetchAll: function(options){
            this.options = _.extend( this.options, options );
            this.repo_collection.reset();
            this.fetchRepoResults();
        },

        fetchRepoResults: function( options ){
            this.options = _.extend( this.options, options );
            var that = this;
            this.container.url = this.options.shed.url + this.container.get( 'urlRoot' );
            console.log('searching for: "' + that.options.query + '"');
            this.container.fetch({
                 data : {
                    jsonp : true,
                    q : that.options.query,
                    page_size: 100
                },
                dataType: 'jsonp',
                success: function( response, results_container ){
                    $('.search-loader').hide();
                    if ( results_container.total_results > 0 ){
                        $('.no-results').hide();
                        console.log( 'total results: ' + results_container.total_results + ' from: ' + results_container.hostname );
                        that.addAll();
                    } else{
                        console.log( 'fetched 0' );
                        $('.no-results').show();
                    }
                    $('.repositories-results-link').text('Repositories(' + results_container.total_results + ')');
                },
                error: function(parsedResponse, statusText, jqXhr){
                    console.log('There was an error while fetching results.');
                },
                timeout : 10000
            });
        },

        // fetchToolResults: function( options ){
        //     this.options = _.extend( this.options, options );
        //     var that = this;
        //     this.tool_container.url = this.options.shed.url + this.container.get( 'urlRoot' );
        //     this.container.fetch({
        //          data : {
        //             jsonp : true,
        //             q : that.options.query,
        //             page_size: 100
        //         },
        //         dataType: 'jsonp',
        //         success: function( response, results_container ){
        //             $('.search-loader').hide();
        //             if ( results_container.total_results > 0 ){
        //                 $('.no-results').hide();
        //                 console.log( 'total results: ' + results_container.total_results + ' from: ' + results_container.hostname );
        //                 $('.repositories-results-link').text('Repositories(' + results_container.total_results + ')');
        //                 that.addAll();
        //             } else{
        //                 console.log( 'fetched 0' );
        //                 $('.no-results').show();
        //             }
        //         },
        //         error: function(parsedResponse, statusText, jqXhr){
        //             console.log('There was an error while fetching results.');
        //         },
        //         timeout : 10000
        //     });
        // },

        addAll: function( container_name ){
            var container = this.container;
            var hostname = container.get( 'hostname' );
            if ( container.get( 'hits' ).length > 0 ){
                for (var i = 0; i < container.get( 'hits' ).length; i++) {
                    var hit = container.get( 'hits' )[ i ]
                    hit.hostname = hostname;
                    this.repo_collection.add( hit );
                }
            }
        },

        renderOneRepo: function( hit ){
            var repoHitView = new RepoHitView( { hit: hit, shed: this.options.shed } );
            this.$el.find('.repo-hits').append( repoHitView.el );
            this.$el.find('[data-toggle="popover"]').popover();
        },

        renderOneTool: function( hit ){
            var toolHitView = new ToolHitView( { hit: hit, shed: this.options.shed } );
            this.$el.find('.tool-hits').append( toolHitView.el );
            this.$el.find('[data-toggle="popover"]').popover();
        }

    });

var SearchApp = Backbone.View.extend({
  searchView: null,
  resultListView: null,

  initialize: function(){
    this.search_router = new SearchRouter();
    this.search_router.on( 'route:home', function() {
      console.log('route:home');
      this.navigate('repos?q=', {trigger: true});
    });

    this.search_router.on( 'route:search_repos', function(q) {
      console.log('route:search_repos');
      if (q === null){
        q = '';
      }
      if (this.searchView === null || this.searchView === undefined){
        console.log('creating new views');
        console.log('query:'+q)
        this.searchView = new SearchView({'app': this, 'query': q});
        this.resultListView = new ResultsView({'app': this});
      } else{
        console.log('reusing views');
        // console.log("inputval: "+$('#search_input').val().toLowerCase().trim());
        console.log('query:'+q)
        $('#search_input').val(q);
        this.searchView.search({'app': this, 'query': q});
      }
    });

    // this.search_router.on( 'route:search_tools', function(q) {
    //   console.log('route:search_tools');
    //   if (this.searchView === null || this.searchView === undefined){
    //     this.searchView = new SearchView({'app': this, 'query': q});
    //     this.resultListView = new ResultsView({'app': this});
    //   } else{
    //     this.searchView.search({'app': this, 'query': q});
    //   }
    // });

    Backbone.history.start({pushState: false});
  },
});

$(function() {
  window.searchApp = new SearchApp();
});

});
