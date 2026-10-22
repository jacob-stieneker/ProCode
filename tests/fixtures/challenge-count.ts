import { cleanExerciseInfo } from '../../src/app/core/clean/model';
import { gitExerciseInfo } from '../../src/app/core/git/model';
import { fullstackExerciseInfo } from '../../src/app/core/fullstack/model';
import { exercises } from '../../src/app/core/exercises';
import { angularExerciseInfo } from '../../src/app/core/angular/model';
import { webExerciseInfo } from '../../src/app/core/web/model';
import { firebaseExerciseInfo } from '../../src/app/core/firebase/model';
export const totalChallenges =
  exercises.length * 2 +
  angularExerciseInfo.length +
  webExerciseInfo.length +
  firebaseExerciseInfo.length +
  fullstackExerciseInfo.length +
  gitExerciseInfo.length +
  cleanExerciseInfo.length * 2;
