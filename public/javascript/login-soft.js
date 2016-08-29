var Login = function () {

  return {
    //main function to initiate the module
    init: function () {

      $('.login-form').validate({
        errorElement: 'label', //default input error message container
        errorClass: 'help-inline', // default input error message class
        focusInvalid: false, // do not focus the last invalid input
        rules: {
          username: {
            required: true
          },
          password: {
            required: true
          },
          remember: {
            required: false
          }
        },

        messages: {
          username: {
            required: "用户名不能为空."
          },
          password: {
            required: "密码不能为空."
          }
        },

        invalidHandler: function (event, validator) { //display error alert on form submit
          $('.alert-error', $('.login-form')).show();
        },

        highlight: function (element) { // hightlight error inputs
          $(element)
            .closest('.control-group').addClass('error'); // set error class to the control group
        },

        success: function (label) {
          label.closest('.control-group').removeClass('error');
          label.remove();
        },

        errorPlacement: function (error, element) {
          error.addClass('help-small no-left-padding').insertAfter(element.closest('.input-icon'));
        },

        submitHandler: function (form) {
          var username = $("input[name=username]").val().trim();
          var password = $("input[name=password]").val().trim();
          $.ajax({
            url: "/login",
            type: "post",
            data: {
              username: username,
              password: password
            },
            success: function (data) {
              if (data.result == "fail") {
                $('.alert-error', $('.login-form')).show();
              } else {
                window.location.href = "/index";
              }
            },
            error: function (data) {
              console.log(data);
            }
          });
        }
      });

      $('.login-form input').keypress(function (e) {
        if (e.which == 13) {
          if ($('.login-form').validate().form()) {
            var username = $("input[name=username]").val();
            var password = $("input[name=password]").val();
            $.ajax({
              url: "/login",
              type: "post",
              data: {
                username: username,
                password: password
              },
              success: function (data) {
                if (data.result == "fail") {
                  $('.alert-error', $('.login-form')).show();
                } else {
                  window.location.href = "/index";
                }
              },
              error: function (data) {
                console.log(data);
              }
            });
          }
          return false;
        }
      });

      $.backstretch([
        "../image/bg/1.jpg",
        "../image/bg/2.jpg",
        "../image/bg/3.jpg",
        "../image/bg/4.jpg"
      ], {
        fade: 1000,
        duration: 8000
      });
    }

  };

}();