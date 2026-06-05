import { requireAuth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { CheckSquare, Clock } from "lucide-react"
import { formatDate } from "@/lib/utils"
import { TaskFormDialog } from "./task-form"
import { CompleteTaskButton, DeleteTaskButton } from "./task-actions"

function toDateInput(d: Date | null): string | null {
  return d ? d.toISOString().slice(0, 10) : null
}

export default async function TasksPage() {
  const user = await requireAuth()

  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const tomorrow = new Date(today)
  tomorrow.setDate(tomorrow.getDate() + 1)

  const [tasks, todayTasks, overdueTasks, users] = await Promise.all([
    prisma.task.findMany({
      where: { organisationId: user.organisationId },
      include: {
        assignedTo: true,
        child: true
      },
      orderBy: { dueDate: 'asc' }
    }),
    prisma.task.findMany({
      where: {
        organisationId: user.organisationId,
        dueDate: {
          gte: today,
          lt: tomorrow
        },
        status: { not: 'COMPLETED' }
      }
    }),
    prisma.task.findMany({
      where: {
        organisationId: user.organisationId,
        dueDate: { lt: today },
        status: { not: 'COMPLETED' }
      }
    }),
    prisma.user.findMany({
      where: { organisationId: user.organisationId },
      select: { id: true, name: true },
      orderBy: { name: 'asc' }
    })
  ])

  const pending = tasks.filter(t => t.status === 'PENDING').length
  const inProgress = tasks.filter(t => t.status === 'IN_PROGRESS').length
  const completed = tasks.filter(t => t.status === 'COMPLETED').length

  const categoryColors: Record<string, string> = {
    ADMIN: 'bg-blue-100 text-blue-800',
    COMPLIANCE: 'bg-purple-100 text-purple-800',
    FINANCE: 'bg-green-100 text-green-800',
    PARENT_UPDATES: 'bg-orange-100 text-orange-800'
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Tasks</h1>
          <p className="text-gray-600 mt-1">
            Manage and track tasks and to-dos
          </p>
        </div>
        <TaskFormDialog users={users} />
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">
              Total Tasks
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{tasks.length}</div>
          </CardContent>
        </Card>

        <Card className="border-2 border-red-200">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">
              Overdue
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-red-600">{overdueTasks.length}</div>
            <p className="text-xs text-gray-600 mt-1">Past due date</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">
              Due Today
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-orange-600">{todayTasks.length}</div>
            <p className="text-xs text-gray-600 mt-1">Requires attention</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">
              Completed
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">{completed}</div>
            <p className="text-xs text-gray-600 mt-1">
              {tasks.length > 0 ? Math.round((completed / tasks.length) * 100) : 0}% completion
            </p>
          </CardContent>
        </Card>
      </div>

      {overdueTasks.length > 0 && (
        <Card className="border-2 border-red-600">
          <CardHeader>
            <CardTitle className="text-red-900 flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Overdue Tasks ({overdueTasks.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {overdueTasks.map((task) => (
                <div
                  key={task.id}
                  className="p-4 bg-red-50 border-2 border-red-200 rounded-md"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h4 className="font-semibold">{task.title}</h4>
                      {task.description && (
                        <p className="text-sm text-gray-600 mt-1">{task.description}</p>
                      )}
                      <div className="flex items-center gap-2 mt-2">
                        <Badge className={categoryColors[task.category]}>
                          {task.category.replace('_', ' ')}
                        </Badge>
                        {task.dueDate && (
                          <span className="text-sm text-gray-600">
                            Due: {formatDate(task.dueDate)}
                          </span>
                        )}
                      </div>
                    </div>
                    <CompleteTaskButton id={task.id} />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {todayTasks.length > 0 && (
        <Card className="border-2 border-orange-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-orange-600" />
              Due Today ({todayTasks.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {todayTasks.map((task) => (
                <div
                  key={task.id}
                  className="p-4 bg-orange-50 border-2 border-orange-200 rounded-md"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h4 className="font-semibold">{task.title}</h4>
                      {task.description && (
                        <p className="text-sm text-gray-600 mt-1">{task.description}</p>
                      )}
                      <div className="flex items-center gap-2 mt-2">
                        <Badge className={categoryColors[task.category]}>
                          {task.category.replace('_', ' ')}
                        </Badge>
                      </div>
                    </div>
                    <CompleteTaskButton id={task.id} />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>All Tasks</CardTitle>
        </CardHeader>
        <CardContent>
          {tasks.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12">
              <CheckSquare className="h-16 w-16 text-gray-300 mb-4" />
              <h3 className="text-lg font-semibold mb-2">No tasks yet</h3>
              <p className="text-gray-600 text-center mb-4">
                Create your first task to get started.
              </p>
              <TaskFormDialog users={users} />
            </div>
          ) : (
            <div className="space-y-2">
              {tasks.filter(t => t.status !== 'COMPLETED').map((task) => (
                <div
                  key={task.id}
                  className="p-4 border-2 border-gray-200 rounded-md hover:border-black transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h4 className="font-semibold">{task.title}</h4>
                      {task.description && (
                        <p className="text-sm text-gray-600 mt-1">{task.description}</p>
                      )}
                      <div className="flex items-center gap-2 mt-2">
                        <Badge className={categoryColors[task.category]}>
                          {task.category.replace('_', ' ')}
                        </Badge>
                        {task.dueDate && (
                          <span className="text-sm text-gray-600">
                            Due: {formatDate(task.dueDate)}
                          </span>
                        )}
                        {task.assignedTo && (
                          <span className="text-sm text-gray-600">
                            • {task.assignedTo.name}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <Badge variant={task.status === 'IN_PROGRESS' ? 'warning' : 'secondary'}>
                        {task.status.replace('_', ' ')}
                      </Badge>
                      <TaskFormDialog
                        users={users}
                        task={{
                          id: task.id,
                          title: task.title,
                          description: task.description,
                          category: task.category,
                          status: task.status,
                          dueDate: toDateInput(task.dueDate),
                          assignedToId: task.assignedToId,
                        }}
                      />
                      <DeleteTaskButton id={task.id} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
