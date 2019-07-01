$(document).ready(function() {
  $(".dropdown-toggle").dropdown();

  var $likeBtn = $("#likeBtn");
  $likeBtn.submit(function() {
    $.post(
      $(this).attr("/:uName/post/:postid/like"),
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
      $(this).attr("/:uName/post/:postid/unlike"),
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
      $(this).attr("/:uName/follow"),
      $(this).serialize(),
      function(response) {
      },
      "json"
    );
    return false;
  });

  document.querySelector(".showCommentArea").addEventListener("click", function(){
    if(document.querySelector(".addCommentArea").style.display === "none"){
      document.querySelector(".addCommentArea").style.display = "block"
    } else {
      document.querySelector(".addCommentArea").style.display = "none"
    }
  });

});
