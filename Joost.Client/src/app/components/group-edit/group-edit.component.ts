﻿import { Component, OnInit } from '@angular/core';
import { Location } from '@angular/common';
import { ActivatedRoute, Params } from "@angular/router";

import { UserService } from "../../services/user.service";
import { ContactService } from "../../services/contact.service";
import { Group } from "../../models/group";
import { GroupService } from "../../services/group.service";
import { UserContact } from "../../models/user-contact";
import { MDL } from "../mdl-base.component";
import { FileService } from "../../services/file.service";
import { AvatarService } from "../../services/avatar.service";

@Component({
    selector: 'app-group-edit',
    templateUrl: './group-edit.component.html',
    styleUrls: ['./group-edit.component.scss']
})
// поки зроблю працююча лише для сценарію  сторення новрї групи
export class GroupEditComponent extends MDL implements OnInit {
    group: Group;
    unselectedMembers: Array<UserContact> = [];
    selectedMembers: Array<UserContact> = [];
    filteredMembers: Array<UserContact> = [];
    filterStr: string;
    editMode: boolean = false;
    imgSrc: string;
    constructor(
        private route: ActivatedRoute,
        private groupService: GroupService,
        private location: Location,
        private contactService: ContactService,
        private avatarService: AvatarService,
        private fileService: FileService
    ) {
            super();
    }
    
    ngOnInit(): void {
        // get group id (if it exist)
        this.route.params
            .subscribe(
            (params: Params) => {
                if (params['id']) {                
                    this.group.Id = +params['id'];
                    this.editMode = true;
                }
            });
        
        // get current user contact list
        this.contactService.getAllContacts()
        .subscribe(response => {
            this.unselectedMembers = response;
            this.filteredMembers = response;
        },
            async err => {
                await this.contactService.handleTokenErrorIfExist(err).then(ok => {
                    if (ok) {
                        this.contactService.getAllContacts().subscribe(response => {
                            this.unselectedMembers = response;
                            this.filteredMembers = response;
                        })
                    }
                });
            }
        );
        
        // init class members
        if (!this.editMode) {
            // route: /groups/new
            this.group = new Group();
            this.imgSrc = "assets/img/Group-icon.png";
        } else {
            // route: /groups/edit/:id
            this.groupService.getGroup(this.group.Id)
                .subscribe(response => {
                    this.group = response;
                    this.initArrays();
                },
                async err => {
                    await this.contactService.handleTokenErrorIfExist(err).then(ok => { 
                        if (ok) {
                            this.groupService.getGroup(this.group.Id).subscribe(response => {                
                                this.group = response;
                                this.imgSrc = this.avatarService.getFullUrl(this.group.Id, true);
                                this.initArrays();
                            });
                        }
                    });
                });
        }            
    }

    onSearch(substr: string): void{
        this.filterStr = substr.toLocaleLowerCase();
        this.filteredMembers = this.unselectedMembers.filter(member => member.Name.toLocaleLowerCase().includes(this.filterStr));
    }

    onClick(e:number): void{
        console.log(e);
    }

    onAddMember(userId: number): void {
        let index = this.unselectedMembers.findIndex( u=> u.Id == userId);
        if(index != -1) {
            this.group.SelectedMembersId.push(userId);
            this.selectedMembers.push(this.unselectedMembers[index]);
            this.unselectedMembers.splice(index, 1);
            this.filteredMembers = this.unselectedMembers;
        };
    }

    onDeleteMember(userId: number): void {
        let index = this.selectedMembers.findIndex( u=> u.Id == userId);
        if(index != -1) {
            this.group.SelectedMembersId.splice(index, 1);
            this.unselectedMembers.push(this.selectedMembers[index]);
            this.selectedMembers.splice(index, 1);
            this.filteredMembers = this.unselectedMembers;
        };
    }

    onSubmit(): void {
        if(!this.isCanSaveOrCreate())
            return;
        if (!this.editMode) {
            // route: /groups/new
            this.groupService.addGroup(this.group).subscribe(response => {                
                console.log("Inserted");
            },
            async err => {
                await this.groupService.handleTokenErrorIfExist(err).then(ok => {
                    if (ok) { 
                        this.groupService.addGroup(this.group).subscribe(response => {                
                            console.log("Inserted");
                        });
                    }
                });
            });
        } else {
            // route: /groups/edit/:id
            this.groupService.putGroup(this.group.Id, this.group).subscribe(response => {                
                console.log("Updated");
            }, 
            async err => {
                await this.groupService.handleTokenErrorIfExist(err).then(ok => {
                    if (ok) { 
                        this.groupService.putGroup(this.group.Id, this.group).subscribe(response => {                
                            console.log("Updated");
                        });
                    }
                });
            });
        }
    }
    
    SendAvatar(e: Event) {
        console.log("upload group avatar");
        var target: HTMLInputElement = e.target as HTMLInputElement;
        if(this.editMode) {
            console.log("upload group avatar in editmode");
            this.avatarService.SetGroupAvatar(target.files[0], this.group.Id).subscribe(
                res => {
                    this.group.Avatar = this.group.Id + "g_avatar." + this.fileService.getFileExtensions(target.files[0].name);
                    this.imgSrc = this.avatarService.getFullUrl(this.group.Id, true) + '?random+\=' + Math.random();
                }, 
                error => console.log("Fail when setting new group avatar")
            );
        }
        else {
            console.log("upload group avatar in newmode");
            let filename = Date.now().toString() + "_" + target.files[0].name;
            this.fileService.UploadFile(target.files[0], filename).subscribe(
                res => {
                   this.group.Avatar = filename;
                   this.imgSrc = this.fileService.getFullFileUrlWithOutEx(filename) + '?random+\=' + Math.random();
                }, 
                error => console.log("Fail when setting group avatar")
            )
        }
    }

    onGroupNameKeyUp(value: string): void{
        this.group.Name = value;
    }

    onGroupDescriptionKeyUp(value: string): void{
        this.group.Description = value;
    }

    onCancel(): void {
        this.location.back();
    }

    initArrays(): void{
        if(this.group) {
            for(let id in this.group.SelectedMembersId) {
                let index = this.unselectedMembers.findIndex( u=> u.Id == +id);
                if(index != -1) {
                    this.selectedMembers.push(this.unselectedMembers[index]);
                    this.unselectedMembers.splice(index, 1);
                }
            }
            this.filteredMembers = this.unselectedMembers;
        }
    }


    trackByUsers(index: number, user: UserContact): number { 
        return user.Id;
    }

    canShowWrongNameTip(): boolean{
        return !(this.group && this.group.Name && this.group.Name.length >=4)
    }

    canShowNotEnoughMembers(): boolean{
        return !this.canShowWrongNameTip() && this.group.SelectedMembersId.length < 1;
    }

    isCanSaveOrCreate(): boolean{
        return !(this.canShowNotEnoughMembers() || this.canShowWrongNameTip());
    }
}
