(function () {
  'use strict';

  var pageObjects = [];
  var urlHistory = [];
  var firstPromise = new $.Deferred().resolve();

  function pageFactory(url, $element, enter, leave) {
    return {
      url: url,
      $element: $element,
      enter: enter || pageEnter,
      leave: leave || pageLeave
    };
  }

  function add(url, $element, enter, leave) {
    pageObjects.push(pageFactory(url, $element, enter, leave));
  }

  function start() {
    $(window)
      .on('hashchange', urlChangeHandler)
      .trigger('hashchange');
  }

  function pageEnter($element) {
    var $page = $element
      .addClass('page-enter')
      .appendTo('article');
    return animEnd($page).then(function () {
      $element.removeClass('page-enter');
    });
  }

  function pageLeave($element) {
    var $page = $element.addClass('page-leave');
    return animEnd($page).then(function () {
      $element.detach();
      $element.removeClass('page-leave');
    });
  }

  function animEnd($element) {
    var dfd = new $.Deferred,
      callback = function () {
        dfd.resolve($element);
      };

    if ($element.length === 0 || $element.css('-webkit-animation') === undefined) {
      dfd.resolve();
      return dfd;
    }

    $element.on('animationend webkitAnimationEnd oAnimationEnd', callback);
    dfd.done(function () {
      $element.off('animationend webkitAnimationEnd oAnimationEnd', callback);
    });

    return dfd;
  }

  function urlChangeHandler() {
    var pageId = parseUrl(location.hash);

    urlHistory.push(pageId);

    scanLast(urlHistory, function (prev, next) {
      var prevPage = getPage(pageObjects, prev)
        , nextPage = getPage(pageObjects, next);

      firstPromise.then(function () {
        var page = prevPage;
        if (page) {
          return page.leave(page.$element, pageLeave.bind(page, page.$element), prev, next);
        }
      }).then(function () {
        var page = nextPage;
        return page.enter(nextPage.$element, pageEnter.bind(page, page.$element), prev, next);
      });
    });
  }

  function scanLast(array, func) {
    var temp = array.slice(-2);
    if (temp.length === 1) {
      temp.unshift(null);
    }
    return func.apply(this, temp);
  }

  function parseUrl(url) {
    return url.slice(1) || 1;
  }

  function getPage(pages, key) {
    return pages
        .filter(function (element) {
          return element.url == key;
        })[0] || null;
  }

  window.myRouter = {
    add: add,
    start: start
  };

}());
