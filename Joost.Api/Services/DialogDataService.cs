﻿using System.Threading.Tasks;
using Joost.DbAccess.Entities;
using Joost.DbAccess.Interfaces;
using System.Linq;
using System.Data.Entity;
using Joost.Api.Models;
using System.Collections.Generic;

namespace Joost.Api.Services
{
    public class DialogDataService : IDialogDataService
    {
        private IUnitOfWork _unitOfWork;

        public DialogDataService(IUnitOfWork unitOfWork)
        {
            _unitOfWork = unitOfWork;
        }

        public Message GetLastMessageInUserDialog(int userId)
        {
            return _unitOfWork.Repository<Message>()
                .Query()
                .Include(m => m.Sender)
                .Include(m => m.Receiver)
                .Where(m => m.Sender.Id == userId || m.Receiver.Id == userId)
                .OrderByDescending(m => m.CreatedAt)
                .FirstOrDefault();
        }

        public GroupMessage GetLastMessageInGroupDialog(int groupId)
        {
            return _unitOfWork.Repository<GroupMessage>()
                .Query()
                .Include(m => m.Sender)
                .Include(m => m.Receiver)
                .Where(m => m.Receiver.Id == groupId)
                .OrderByDescending(m => m.CreatedAt)
                .FirstOrDefault();
        }

        public async Task<IEnumerable<DialogDataDto>> GetUserDialogsData(int userId)
        {
            var users = await _unitOfWork.Repository<Message>()
                .Query()
                .Include(m => m.Sender)
                .Include(m => m.Receiver)
                .Where(m => m.Sender.Id == userId || m.Receiver.Id == userId)
                .Select(m => m.Receiver.Id == userId ? m.Sender : m.Receiver)
                .Distinct()
                .ToListAsync();
            var dialogs = users.Select(
                u => new DialogDataDto
                {
                    Id = u.Id,
                    Name = u.FirstName,
                    LastMessage = GetLastMessageInUserDialog(u.Id).Text,
                    Avatar = u.Avatar,
                    IsGroup = false
                }
            );
            return dialogs;
        }

        public async Task<IEnumerable<DialogDataDto>> GetGroupDialogsData(int userId)
        {
            var groups = await _unitOfWork.Repository<Group>()
                .Query()
                .Where(g => g.Members.Any(i => i.Id == userId))
                .ToListAsync();
            var dialogs = groups.Select(
                g => new DialogDataDto
                {
                    Id = g.Id,
                    Name = g.Name,
                    LastMessage = GetLastMessageInGroupDialog(g.Id).Text,
                    Avatar = string.Empty,
                    IsGroup = true
                }
            );
            return dialogs;
        }
    }
}