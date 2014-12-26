
export function invert (A) {

  var N = A.length;

  var [L,U] = decomposeLU(A, N);

  var X = matrix(N, N);

  for (let i = 0; i < N; i++) {

    let b = Array(N);

    for (let j = 0; j < N; j++) {
      b[j] = i === j ? 1 : 0;
    }

    X[i] = evaluateLU(L, U, b);

  }

  return transpose(X);
}

export function decomposeLU (A, n) {

  var U = JSON.parse(JSON.stringify(A));

  var L = eye(n);

  for (let i = 1; i <= n-1; i++) {

    for (let k = i+1; k <= n; k++) {

      L[k-1][i-1] = U[k-1][i-1] / U[i-1][i-1];

      for (let j = i; j <= n; j++) {

        U[k-1][j-1] = U[k-1][j-1] - L[k-1][i-1] * U[i-1][j-1];

      }

    }

  }

  return [L, U];
}

export function evaluateLU (L, U, b) {

  var n = b.length;

  var y = Array(n);

  for (let i = 0; i < n; i++) {
    y[i] = b[i];

    for (let j = 0; j < i; j++) {
      y[i] -= L[i][j] * y[j];
    }

    y[i] /= L[i][i];
  }

  var x = Array(n);

  for (let i = n - 1; i >= 0; i--) {
    x[i] = y[i];

    for (let j = i + 1; j < n; j++) {
      x[i] -= U[i][j] * x[j];
    }

    x[i] /= U[i][i];
  }

  return x;
}

export function mult (A, B) {

  var C = matrix(A.length, B[0].length);

  for (let a_i = 0; a_i < A.length; a_i++) {

    for (let b_j = 0; b_j < B[0].length; b_j++) {

      C[a_i][b_j] = 0;

      for (let a_j = 0; a_j < A[0].length; a_j++) {

        C[a_i][b_j] += A[a_i][a_j] * B[a_j][b_j];

      }

    }

  }

  return C;
}

export function transpose (A) {

  var C = matrix(A[0].length, A.length);

  for (let i = 0; i < A[0].length; i++) {

    for (let j = 0; j < A.length; j++) {

      C[i][j] = A[j][i];

    }

  }

  return C;
}

export function eye (n) {

  var A = Array(n);

  for (var i = 0; i < n; i++) {
    A[i] = Array(n);

    for (var j = 0; j < n; j++) {
      A[i][j] = i === j ? 1 : 0;
    }

  }

  return A;
}

export function matrix (n, m) {

  var C = Array(n);
  for (var i = 0; i < n; i++) {
    C[i] = Array(m);
  }

  return C;
}
