function RecentlyChanged() {
    var that = this;
    this.display = function(element) {
        var appHeader = rally.sdk.ui.AppHeader;
        rally.sdk.ui.AppHeader.showPageTools(true);
        rally.sdk.ui.AppHeader.setHelpTopic("244");
        var yesterdayTaskTable,todayTaskTable,yesterdayDefectTable,todayDefectTable, yesterdayStoryTable,todayStoryTable,lastWorkDate,teamMemberTable;
        var lastWorkDateWithoutTime, todayWithoutTime;
        var teamMemberUpdatedYesterday = new Object();
        var teamMemberUpdatedToday = new Object();
        var rallyDataSource = new rally.sdk.data.RallyDataSource('__WORKSPACE_OID__',
            '__PROJECT_OID__',
            '__PROJECT_SCOPING_UP__',
            '__PROJECT_SCOPING_DOWN__');

        function createStoryTable(stories, storyTable, divID, teamMemberUpdated, begDateFilter, endDateFilter) {
            if (storyTable) {
                storyTable.destroy();
            }

            var tableConfig = {
               columnKeys:["FormattedIDLink","Name","LastUpdatedTime","Author","changeDescription"],
               columnHeaders:["ID", "Name","Time", "Author","Change Description"],
            };

            storyTable = new rally.sdk.ui.Table(tableConfig);

            dojo.forEach(stories, function(story) {
                story.FormattedIDLink = new rally.sdk.ui.basic.Link({item:story});
                var lastRevision = story.RevisionHistory.Revisions[0];
                story.LastUpdatedTime = rally.sdk.util.DateTime.fromIsoString(lastRevision.CreationDate,true);

                var revisions = story.RevisionHistory.Revisions;

                for (i = 0; i < revisions.length; i++) {
                    story.LastUpdatedTime = rally.sdk.util.DateTime.fromIsoString(revisions[i].CreationDate,true);
                    var lastWorkDateAsDateObj = new Date(begDateFilter);
                    var todayAsDateObj = endDateFilter==null ? null : new Date(endDateFilter);
                    var compare = story.LastUpdatedTime < lastWorkDateAsDateObj;
                    console.log("Processing US " + story.FormattedID + " LastUpdatedTime= " + story.LastUpdatedTime + " lastWorkDateAsDateObj= " + lastWorkDateAsDateObj + " compare=" + compare + " todayAsDateObj=" + todayAsDateObj);
                    story.Author = revisions[i].User._refObjectName;
                    story.changeDescription = revisions[i].Description;
                    if(story.LastUpdatedTime < lastWorkDateAsDateObj)
                    {
                        console.log("skip");
                        break;
                    }                        
                    if(todayAsDateObj != null && story.LastUpdatedTime >= todayAsDateObj)
                    {
                        console.log("continue");                     
                        continue;
                    }                           
                    teamMemberUpdated[story.Author] = true;
                    storyTable.addRow(story);
                }

            });
            storyTable.display(divID);
        }

        function createDefectTable(defects, defectTable, divID, teamMemberUpdated, begDateFilter, endDateFilter) {
            if (defectTable) {
                defectTable.destroy();
            }


            var tableConfig = {
                columnKeys:["FormattedIDLink","Name","LastUpdatedTime","Author","changeDescription"],
                columnHeaders:["ID", "Name","Time", "Author","Change Description"],
            };

            defectTable = new rally.sdk.ui.Table(tableConfig);

            dojo.forEach(defects, function(defect) {
                defect.FormattedIDLink = new rally.sdk.ui.basic.Link({item:defect});

                var revisions = defect.RevisionHistory.Revisions
                for (i = 0; i < revisions.length; i++) {
                    defect.LastUpdatedTime = rally.sdk.util.DateTime.fromIsoString(revisions[i].CreationDate,true);
                    var lastWorkDateAsDateObj = new Date(begDateFilter);
                    var todayAsDateObj = endDateFilter==null ? null : new Date(endDateFilter);
                    var compare = defect.LastUpdatedTime < lastWorkDateAsDateObj;
                    defect.Author = revisions[i].User._refObjectName;

                    defect.changeDescription = revisions[i].Description;

                    console.log("Processing " + defect.FormattedID + " LastUpdatedTime= " + defect.LastUpdatedTime + " lastWorkDateAsDateObj= " + lastWorkDateAsDateObj + " compare=" + compare + " Author:" + String(defect.Author));
                    if(defect.LastUpdatedTime < lastWorkDateAsDateObj)
                    {
                       console.log("skip");
                        break;
                    } 
                            
                    if(String(defect.Author) == "Bugzilla Connector" || (todayAsDateObj !=null && defect.LastUpdatedTime >= todayAsDateObj))
                    {                     
                        continue;
                    }
                    teamMemberUpdated[defect.Author] = true;
                    defectTable.addRow(defect);
                }
            });

            defectTable.display(divID);

        }

        function createTaskTable(tasks, taskTable, divID, teamMemberUpdated, totalLabel) {
            if (taskTable) {
                taskTable.destroy();
            }
            var todoTotal = 0;

            dojo.forEach(tasks, function(task) {

                task.ParentName = new rally.sdk.ui.basic.Link({
                    item: task.WorkProduct,
                    text: task.WorkProduct.FormattedID + ' ' + task.WorkProduct.Name});

                task.FormattedIDLink = new rally.sdk.ui.basic.Link({item:task});
                task.Owner = task.Owner === null ? "" : task.Owner._refObjectName;
                todoTotal += task.ToDo;
                task.ToDo = task.ToDo === null ? "" : task.ToDo.toFixed(2);
                var lastRevision = task.RevisionHistory.Revisions[0];
                task.LastUpdatedTime = rally.sdk.util.DateTime.fromIsoString(lastRevision.CreationDate,true);
                console.log("lastRevision is " + JSON.stringify(lastRevision));
                task.Author = lastRevision.User._refObjectName;
                teamMemberUpdated[task.Author] = true;
                console.log("teamMemberUpdated["+task.Author + "] = true;");
                task.changeDescription = lastRevision.Description;
            });

            var config = {
                columnKeys:["FormattedIDLink","ParentName","Name","ToDo","Owner","LastUpdatedTime","Author","changeDescription"],
                columnHeaders:["ID", "Work Product", "Name", "To Do", "Owner", "Time", "Author","Change Description"]
            };

            taskTable = new rally.sdk.ui.Table(config);
            taskTable.addRows(tasks);
            taskTable.display(divID);
            var date = dojo.date.locale.format(lastWorkDate, {datePattern: "MMMM dd, yyyy", selector: "date"});
            dojo.byId("lastWorkDay").innerHTML = "Changed Since: " + date;
            dojo.byId(totalLabel).innerHTML = "To Do Total: " + todoTotal.toFixed(2);
        }

        function createUpdateTable(teamMembers) {
            if (teamMemberTable) {
                teamMemberTable.destroy();
            }

            dojo.forEach(teamMembers, function(teamMember) {
                console.log("Processing team member - " + teamMember.DisplayName);
                teamMember.Yesterday = teamMemberUpdatedYesterday[teamMember.DisplayName];
                teamMember.Today = teamMemberUpdatedToday[teamMember.DisplayName];
                console.log("teamMember.Updated = "+ teamMemberUpdatedYesterday[teamMember.DisplayName]);
            });

            var config = {
                columnKeys:["DisplayName","Yesterday","Today"],
                columnHeaders:["Name", "Yesterday", "Today"]
            };
            teamMemberTable = new rally.sdk.ui.Table(config);
            teamMemberTable.addRows(teamMembers);
            teamMemberTable.display("updateTableDiv");   
        }

        function createTables(rallyData) {
            createTaskTable(rallyData.tasksUpdatedYesterday,yesterdayTaskTable, "lastWorkdayTableDiv", teamMemberUpdatedYesterday, "lastWorkdayTotalLabel");
            createStoryTable(rallyData.storiesUpdatedYesterday,yesterdayStoryTable,"lastWorkdayStoryDiv",teamMemberUpdatedYesterday, lastWorkDateWithoutTime, todayWithoutTime);
            createDefectTable(rallyData.defectsUpdatedYesterday,yesterdayDefectTable,"lastWorkdayDefectDiv",teamMemberUpdatedYesterday, lastWorkDateWithoutTime, todayWithoutTime);
            createTaskTable(rallyData.tasksUpdatedToday,todayTaskTable, "todayTableDiv", teamMemberUpdatedToday, "todayTotalLabel");
            console.log("Starting Today Story Table");
            createStoryTable(rallyData.storiesUpdatedToday,todayStoryTable,"todayStoryDiv",teamMemberUpdatedToday, todayWithoutTime, null);
            createDefectTable(rallyData.defectsUpdatedToday,todayDefectTable,"todayDefectDiv",teamMemberUpdatedToday, todayWithoutTime, null);                    
            createUpdateTable(rallyData.teamMembers);
        }

        function queryDataForTables(lastWorkDateWithoutTime, todayWithoutTime) {
            var queries = [];
            queries.push({
                type:"task",
                key:"tasksUpdatedYesterday",
                fetch:"WorkProduct,Name,FormattedID,ToDo,Owner,LastUpdateDate,RevisionHistory,Revisions",
                query: "((LastUpdateDate >= " + lastWorkDateWithoutTime + ") AND (LastUpdateDate < " + todayWithoutTime + "))",
                order: "LastUpdateDate desc"

            });

            queries.push({
                type:"task",
                key:"tasksUpdatedToday",
                fetch:"WorkProduct,Name,FormattedID,ToDo,Owner,LastUpdateDate,RevisionHistory,Revisions",
                query: "(LastUpdateDate >= " + todayWithoutTime + ")",
                order: "LastUpdateDate desc"

            });                    

            queries.push({
                type:"HierarchicalRequirement",
                key:"storiesUpdatedYesterday",
                fetch:"Name,FormattedID,LastUpdateDate,RevisionHistory,Revisions",
                query: "(LastUpdateDate >= " + lastWorkDateWithoutTime + ")",
                order: "LastUpdateDate desc"

            });

            queries.push({
                type:"HierarchicalRequirement",
                key:"storiesUpdatedToday",
                fetch:"Name,FormattedID,LastUpdateDate,RevisionHistory,Revisions",
                query: "(LastUpdateDate >= " + todayWithoutTime + ")",
                order: "LastUpdateDate desc"

            });

            queries.push({
                type:"Defect",
                key:"defectsUpdatedYesterday",
                fetch:"Name,FormattedID,LastUpdateDate,RevisionHistory,Revisions",
                query: "(LastUpdateDate >= " + lastWorkDateWithoutTime + ")",  
                order: "LastUpdateDate desc"
            });

            queries.push({
                type:"Defect",
                key:"defectsUpdatedToday",
                fetch:"Name,FormattedID,LastUpdateDate,RevisionHistory,Revisions",
                query: "(LastUpdateDate >= " + todayWithoutTime + ")", 
                order: "LastUpdateDate desc"
            });

            queries.push({
                type:"User",
                key:"teamMembers",
                query: '(TeamMemberships = /project/__PROJECT_OID__)',
                fetch: 'UserName,DisplayName'
            });

            rallyDataSource.find(queries, createTables);
        }

        function execute() {

            function getCurrentDayOfWeek() {
                return dojo.date.locale.format(new Date(), {
                    datePattern:"EEEE",
                    selector:"date",
                    locale:'en-us'});
            }

            function getLastWorkDay(results) {
                var week = ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"];
                var workDays = results.workspace[0].WorkDays.split(",");
                var currentDayName = getCurrentDayOfWeek();

                var lastWorkDay;
                var lastWorkDayIndex = dojo.indexOf(workDays, currentDayName) - 1;
                if (lastWorkDayIndex === -2 || lastWorkDayIndex === -1) {
                    lastWorkDay = workDays[workDays.length - 1];
                } else {
                    lastWorkDay = workDays[lastWorkDayIndex];
                }

                var daysSinceLastWorkDay = dojo.indexOf(week, currentDayName) - dojo.indexOf(week, lastWorkDay);
                daysSinceLastWorkDay = daysSinceLastWorkDay > 0 ? daysSinceLastWorkDay : daysSinceLastWorkDay + 7;

                var today = new Date();
                lastWorkDate = dojo.date.add(today, "day", -daysSinceLastWorkDay);

                var isoDate = dojo.date.stamp.toISOString(lastWorkDate);
                lastWorkDateWithoutTime = isoDate.substring(0, isoDate.length - 15);

                var todayIsoDate = dojo.date.stamp.toISOString(today);
                todayWithoutTime = todayIsoDate.substring(0, todayIsoDate.length - 15);
                console.log("Query Dates: " + lastWorkDateWithoutTime +", "+ todayWithoutTime);
                queryDataForTables(lastWorkDateWithoutTime,todayWithoutTime);
            }

            rallyDataSource.find({
                type:"WorkspaceConfiguration",
                key: "workspace",
                fetch: "WorkDays"
            }, getLastWorkDay);
        }

        execute();
    };

}
