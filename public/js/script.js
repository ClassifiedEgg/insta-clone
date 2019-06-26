$(document).ready(function() {
  $(".dropdown-toggle").dropdown();

  var $likeBtn = $("#likeBtn");
  $likeBtn.submit(function() {
    $.post(
      $(this).attr("/:id/post/:postid/like"),
      $(this).serialize(),
      function(response) {
      },
      "json"
    );
    return false;
  });
  
  var $unlikeBtn = $("#unlikeBtn");
  $unlikeBtn.submit(function() {
    $.post(
      $(this).attr("/:id/post/:postid/unlike"),
      $(this).serialize(),
      function(response) {
      },
      "json"
    );
    return false;
  });
  
  var $followBtn = $("#followBtn");
  $followBtn.submit(function() {
    $.post(
      $(this).attr("/:id/follow"),
      $(this).serialize(),
      function(response) {
      },
      "json"
    );
    return false;
  });


});
