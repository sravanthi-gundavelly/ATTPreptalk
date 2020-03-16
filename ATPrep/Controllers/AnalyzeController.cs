using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace ATPrep.Controllers
{
    [Authorize]
    public class AnalyzeController : Controller
    {
       
        public IActionResult Index()
        {
            ViewBag.current = "Analyze";
            return View();
        }
        public IActionResult Analyze()
        {
            ViewBag.current = "Analyze";
            return View();
        }
        public IActionResult Visualise()
        {
            ViewBag.current = "Analyze";
            return View();
        }

        public IActionResult analytic()
        {
            ViewBag.current = "Analyze";
            return View();
        }

        public IActionResult RoleVisualise()
        {
            ViewBag.current = "Analyze";
            return View();
        }

    }
}