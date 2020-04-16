using ATPrep.Models;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Authentication.Cookies;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Newtonsoft.Json;
using System;
using System.Collections.Generic;
using System.Data.SqlClient;
using System.Diagnostics;
using System.Net.Http;
using System.Security.Claims;
using System.Text;
using System.Threading.Tasks;

namespace ATPrep.Controllers
{
    [Authorize]
    public class HomeController : Controller
    {
        [AllowAnonymous]

        public IActionResult Index()
        {
            HttpContext.SignOutAsync(CookieAuthenticationDefaults.AuthenticationScheme);
            if(TempData["shortMessage"] != null)
            {
                ViewBag.ErrorMessage = TempData["shortMessage"].ToString();
                TempData["shortMessage"] = "";
            }
            return RedirectToAction("Loginpage");
           // return View();
        }

        [AllowAnonymous]
        public IActionResult Loginpage()
        {
            HttpContext.SignOutAsync(CookieAuthenticationDefaults.AuthenticationScheme);
            if (TempData["shortMessage"] != null)
            {
                ViewBag.ErrorMessage = TempData["shortMessage"].ToString();
                TempData["shortMessage"] = "";
            }
            return View();
        }

        public IActionResult Privacy()
        {
            return View();
        }

        [Authorize]
        public IActionResult Home()
        {
            ViewBag.current = "Home";
            ViewBag.UserID = HttpContext.Session.GetInt32("User_ID");
            ViewBag.UserName = HttpContext.Session.GetString("UserName");
            ViewBag.UserImage = HttpContext.Session.GetString("UserImage");
            ViewBag.time = HttpContext.Session.GetString("currentlogin");
            ViewBag.Role = HttpContext.Session.GetString("Role");

            return View();
        }

        [AllowAnonymous]
        public async Task<ActionResult> Login(UserModel userModel)
        {
            string Baseurl = "https://preptalk-gi.bfmdev1.com/";

            // var Baseurl = "http://p0152610:81/";
            using (var client = new HttpClient())
            {
                client.BaseAddress = new System.Uri(Baseurl);
                client.DefaultRequestHeaders.Clear();
                client.DefaultRequestHeaders.Accept.Add(new System.Net.Http.Headers.MediaTypeWithQualityHeaderValue("application/json"));
                HttpResponseMessage res = await client.PostAsJsonAsync("validate_user", userModel);

                if (res.IsSuccessStatusCode)
                {
                    var result = res.Content.ReadAsStringAsync().Result;
                    var json = JsonConvert.DeserializeObject<UserModel>(result);

                    if (json == null)
                    {
                        TempData["shortMessage"] = "Login Failed";
                        return RedirectToAction("Loginpage");
                    }
                    HttpContext.Session.SetInt32("User_ID", json.ID);
                    HttpContext.Session.SetString("UserName", json.UserName);
                    HttpContext.Session.SetString("UserImage", json.UserImage);
                    HttpContext.Session.SetString("Role", json.Role);
                    var timeUtc = DateTime.Now;
                   // TimeZoneInfo easternZone = TimeZoneInfo.FindSystemTimeZoneById("Pacific SA Standard Time");
                    DateTime easternTime = TimeZoneInfo.ConvertTimeBySystemTimeZoneId(timeUtc, "Pacific Standard Time");
                    HttpContext.Session.SetString("currentlogin", easternTime.ToString("HH:mm tt PT dd/MM/yyyy"));

                    var claims = new List<Claim>
                {
                 new Claim(ClaimTypes.Name, json.UserName),
                 new Claim("Name", json.UserName),
                 new Claim(ClaimTypes.Role, "Administrator"),
                };
                    var claimsIdentity = new ClaimsIdentity(
                                          claims, CookieAuthenticationDefaults.AuthenticationScheme);

                    var identity = new ClaimsIdentity(new[] {
                    new Claim(ClaimTypes.Name,userModel.UserID)
                }, CookieAuthenticationDefaults.AuthenticationScheme);
                    var authProperties = new AuthenticationProperties
                    {
                        //AllowRefresh = <bool>,
                        // Refreshing the authentication session should be allowed.

                        //ExpiresUtc = DateTimeOffset.UtcNow.AddMinutes(10),
                        //IsPersistent = true,

                    };

                    var login = HttpContext.SignInAsync(
                                CookieAuthenticationDefaults.AuthenticationScheme,
                                new ClaimsPrincipal(claimsIdentity),
                                authProperties);
                    return RedirectToAction("Home");
                }

                else
                {
                    TempData["shortMessage"] = "Login Failed";
                    return RedirectToAction("Loginpage");
                }
            }


        }

        public IActionResult Analysis()
        {
            ViewBag.current = "Analyze";
            return View();
        }

        public IActionResult MicroLearn()
        {
            ViewBag.current = "Micro";
            return View();
        }

        [AllowAnonymous]
        public IActionResult Update()
        {
            try
            {
                //context.ConversationData.TryGetValue<string>("channel",out channel);

                //string channel = "Milestones";
                SqlConnectionStringBuilder builder = new SqlConnectionStringBuilder();
                var cs = "Server=tcp:idcdbserver.database.windows.net,1433;Initial Catalog=IDCDB;Persist Security Info=False;User ID=idclogin;Password=Idc@login;MultipleActiveResultSets=False;Encrypt=True;TrustServerCertificate=False;Connection Timeout=30;";
                using (SqlConnection connection = new SqlConnection(cs))
                {
                    connection.Open();
                    StringBuilder sb = new StringBuilder();
                    sb.Append("update dbo.atnt_bot set flag=0 where User_Name='Sales_TeamLead_Mark_EMPxxx123'");
                    String sql = sb.ToString();
                    using (SqlCommand command = new SqlCommand(sql, connection))
                    {
                       int result= command.ExecuteNonQuery();
                    }
                    connection.Close();
                }
            }
            catch (SqlException e)
            {
                Console.WriteLine(e.ToString());
            }


            return Json(null);
        }
        [ResponseCache(Duration = 0, Location = ResponseCacheLocation.None, NoStore = true)]
        public IActionResult Error()
        {
            return View(new ErrorViewModel { RequestId = Activity.Current?.Id ?? HttpContext.TraceIdentifier });
        }
    }
}
