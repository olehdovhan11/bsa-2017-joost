﻿import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';

import { AuthenticationService } from "../../services/authentication.service";
import { UserService } from "../../services/user.service";

import { UserDetail } from "../../models/user-detail";
import { MDL } from "../mdl-base.component";

@Component({
  selector: 'app-main-menu',
  templateUrl: './main-menu.component.html',
  styleUrls: ['./main-menu.component.scss']
})
export class MainMenuComponent extends MDL implements OnInit {

  private curUser: UserDetail; 
  constructor(
    private router: Router, 
    private route: ActivatedRoute,
    private userService: UserService,
    private authService: AuthenticationService) {
      super();
  }

  ngOnInit() {
    this.authService.getUserId().subscribe(data => {
      this.userService.getUserDetails(data).subscribe( d => this.curUser = d, 
        async err => {
          await this.userService.handleTokenErrorIfExist(err).then(ok => {
            if (ok) { 
              this.userService.getUserDetails(data).subscribe(d => this.curUser = d);
            }
          });
        }
      );
    }, 
    async err => {
      await this.authService.handleTokenErrorIfExist(err).then(ok => {
        if (ok) { 
          this.authService.getUserId().subscribe(data => {
            this.userService.getUserDetails(data).subscribe( d => this.curUser = d);
          })
        }
      });
    });
  }

  onCreateGroup(){
    this.router.navigate(["groups/new"], { relativeTo: this.route });
  }
}
