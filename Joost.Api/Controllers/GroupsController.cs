﻿using Joost.DbAccess.Entities;
using Joost.DbAccess.Interfaces;
using System;
using System.Linq;
using System.Threading.Tasks;
using System.Web.Http;

namespace Joost.Api.Controllers
{
    public class GroupsController : BaseApiController
    {
        public GroupsController(IUnitOfWork unitOfWork) : base(unitOfWork)
        { }

        // GET: api/Groups/5
        [HttpGet]
        public async Task<IHttpActionResult> GetGroups(int userId)
        {
            var groups = (await _unitOfWork.Repository<Group>().AllAsync()).Where(item => item.Members.Any(i => i.Id == userId));
            if (groups == null)
            {
                return NotFound();
            }
            return Ok(groups);
        }

        // GET: api/Groups/5
        [HttpGet]
        public IHttpActionResult GetGroups(string name)
        {
            var groups = _unitOfWork.Repository<Group>()
                .Query()
                .Where(item => item.Name.Contains(name))
                .ToList();
            if (groups==null)
            {
                return NotFound();
            }
            return Ok(groups);
        }

        // GET: api/Groups/5
        [HttpGet]
        public async Task<IHttpActionResult> GetGroup(int id)
        {
            var group = await _unitOfWork.Repository<Group>().GetAsync(id);
            if (group == null)
            {
                return NotFound();
            }

            return Ok(group);
        }

        // POST: api/Groups
        [HttpPost]
        public async Task<IHttpActionResult> AddGroup([FromBody]Group group)
        {
            // did that here in order to prevent datetime formating form client here
            group.CreatedAt = DateTime.Now;

            // don't know, have existed similar to GetCurrentUserId() method from client-side
            // so call that here and assign searched user to GroupCreator property
            var id = GetCurrentUserId();
            var user = _unitOfWork.Repository<User>().Get(id);
            group.GroupCreator = user;

            try
            {
                _unitOfWork.Repository<Group>().Add(group);
                await _unitOfWork.SaveAsync();
                return Ok();
            }
            catch
            {
                return BadRequest();
            }
        }

        // PUT: api/Groups/5
        [HttpPut]
        public async Task<IHttpActionResult> EditGroup(int id, [FromBody]Group group)
        {
            _unitOfWork.Repository<Group>().Attach(group);
            await _unitOfWork.SaveAsync();

            return Ok(group);
        }

        // DELETE: api/Groups/5
        [HttpDelete]
        public async Task DeleteGroup(int id)
        {
            var group = await _unitOfWork.Repository<Group>().FindAsync(item => item.Id == id);
            if (group != null)
            {
                _unitOfWork.Repository<Group>().Delete(group);
                await _unitOfWork.SaveAsync();
            }
        }

        protected override void Dispose(bool disposing)
        {
            if (disposing)
            {
                _unitOfWork.Dispose();
            }
            base.Dispose(disposing);
        }
    }
}
