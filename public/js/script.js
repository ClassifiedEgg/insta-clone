$(document).ready(function() {
  $(".dropdown-toggle").dropdown();

  var $likeBtn = $("#likeBtn");
  $likeBtn.submit(function() {
    $.post(
      $(this).attr("/:uName/post/:postid/like"),
      $(this).serialize(),
      function(response) {},
      "json"
    );
    return false;
  });

  var $unlikeBtn = $("#unlikeBtn");
  $unlikeBtn.submit(function() {
    $.post(
      $(this).attr("/:uName/post/:postid/unlike"),
      $(this).serialize(),
      function(response) {},
      "json"
    );
    return false;
  });

  var $followBtn = $("#followBtn");
  $followBtn.submit(function() {
    $.post(
      $(this).attr("/:uName/follow"),
      $(this).serialize(),
      function(response) {},
      "json"
    );
    return false;
  });

  document
    .querySelector(".showCommentArea")
    .addEventListener("click", function() {
      if (document.querySelector(".addCommentArea").style.display === "none") {
        document.querySelector(".addCommentArea").style.display = "block";
      } else {
        document.querySelector(".addCommentArea").style.display = "none";
      }
    });

});

function hideForm(form) {
  form.style.visibility = "hidden";
  form.style.opacity = "0";
  form.style.transition = "opacity 500ms, visibility 500ms";
  $(form)
    .addClass("animated fadeOutUp")
    .one(
      "webkitAnimatedEnd mozAnimationEnd MSAnimationEnd onanimationend animationend",
      function() {
        $(this).removeClass("animated fadeOutUp");
      }
    );
}
function showForm(form) {
  form.style.visibility = "visible";
  form.style.opacity = "1";
  form.style.transition = "opacity 500ms, visibility 500ms";
  $(form)
    .addClass("animated fadeInDown")
    .one(
      "webkitAnimatedEnd mozAnimationEnd MSAnimationEnd onanimationend animationend",
      function() {
        $(this).removeClass("animated fadeInDown");
      }
    );
}
function displayToggle() {
  let formLogin = document.querySelector(".formLogin").parentElement;
  let formSignup = document.querySelector(".formSignup").parentElement;
  if (formLogin.style.visibility === "visible") {
    // formLogin.style.visibility = "hidden";
    // formLogin.style.opacity = "0";
    hideForm(formLogin);
    showForm(formSignup);

    // formSignup.style.visibility = "visible";
    // formSignup.style.opacity = "1";
    // formSignup.style.transition = "opacity 500ms, visibility 500ms";
  } else {
    // formLogin.style.visibility = "visible";
    // formLogin.style.opacity = "1";
    // formLogin.style.transition = "opacity 500ms, visibility 500ms";

    hideForm(formSignup);
    showForm(formLogin);

    // formSignup.style.visibility = "hidden";
    // formSignup.style.opacity = "0";
  }
}
