using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace ATPrep.Controllers
{
    [Authorize]
    public class AssessmentController : Controller
    {
      
        public IActionResult Index()
        {
            ViewBag.current = "Simulate";
            return View();
        }

        public IActionResult Assessment(string value)
        {
            ViewBag.current = "Simulate";
            ViewBag.Click = value;
            return View();
        }
    }
}