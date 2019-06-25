$(document).ready(function() {
  $(".dropdown-toggle").dropdown();

  var $likeBtn = $("#likeBtn");
  $likeBtn.submit(function() {
    $.post(
      $(this).attr("/:id/post/:postid/like"),
      $(this).serialize(),
      function(response) {
        // do something here on success
      },
      "json"
    );
    return false;
  });
  
  var $unlikeBtn = $("#unlikeBtn");
  $unlike.submit(function() {
    $.post(
      $(this).attr("/:id/post/:postid/unlike"),
      $(this).serialize(),
      function(response) {
        // do something here on success
      },
      "json"
    );
    return false;
  });


});
