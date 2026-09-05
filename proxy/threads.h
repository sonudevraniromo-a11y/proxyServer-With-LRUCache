#ifndef PROJECT_THREADS_H
#define PROJECT_THREADS_H

#if defined(_WIN32) && defined(__MINGW32__)
#define _WIN32_WINNT 0x0600
#include <windows.h>
typedef HANDLE thrd_t;
typedef CRITICAL_SECTION mtx_t;
typedef CONDITION_VARIABLE cnd_t;
#define thrd_success 0
#define thrd_error 1
#define mtx_plain 0
static DWORD WINAPI project_thread_start(LPVOID value) { int (*function)(void *) = ((int (**)(void *))value)[0]; void *argument = ((void **)value)[1]; free(value); return (DWORD)function(argument); }
static int thrd_create(thrd_t *thread, int (*function)(void *), void *argument) { void **context = malloc(2 * sizeof(void *)); if (!context) return thrd_error; context[0] = (void *)function; context[1] = argument; *thread = CreateThread(NULL, 0, project_thread_start, context, 0, NULL); return *thread ? thrd_success : thrd_error; }
static int thrd_join(thrd_t thread, int *result) { DWORD code = WaitForSingleObject(thread, INFINITE); if (result) { DWORD value = 0; GetExitCodeThread(thread, &value); *result = (int)value; } CloseHandle(thread); return code == WAIT_OBJECT_0 ? thrd_success : thrd_error; }
static int mtx_init(mtx_t *mutex, int type) { (void)type; InitializeCriticalSection(mutex); return thrd_success; }
static void mtx_destroy(mtx_t *mutex) { DeleteCriticalSection(mutex); }
static void mtx_lock(mtx_t *mutex) { EnterCriticalSection(mutex); }
static void mtx_unlock(mtx_t *mutex) { LeaveCriticalSection(mutex); }
static int cnd_init(cnd_t *condition) { InitializeConditionVariable(condition); return thrd_success; }
static void cnd_destroy(cnd_t *condition) { (void)condition; }
static int cnd_wait(cnd_t *condition, mtx_t *mutex) { return SleepConditionVariableCS(condition, mutex, INFINITE) ? thrd_success : thrd_error; }
static void cnd_signal(cnd_t *condition) { WakeConditionVariable(condition); }
static void cnd_broadcast(cnd_t *condition) { WakeAllConditionVariable(condition); }
#else
#include <threads.h>
#endif

#endif
